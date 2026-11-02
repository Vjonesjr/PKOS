package com.smartpkos.migration

// Migration source; deliberately not wired into the current Capacitor APK.
import android.content.Context
import androidx.room.*
import androidx.work.*
import kotlinx.coroutines.flow.Flow
import org.json.JSONObject
import java.util.UUID
import java.util.concurrent.TimeUnit

@Entity(primaryKeys=["owner","entity","id"])
data class LocalRecord(val owner:String,val entity:String,val id:String,val payload:String,val serverPayload:String?,val version:Int,val syncState:String="saved")
@Entity(indices=[Index(value=["owner","createdAt"])])
data class PendingMutation(@PrimaryKey val mutationId:String,val owner:String,val entity:String,val recordId:String,val command:String,val payload:String,val createdAt:Long,val state:String="pending",val leaseUntil:Long=0,val error:String?=null)
@Entity data class SyncCursor(@PrimaryKey val owner:String,val revision:Long)
@Dao abstract class MvpDao {
 @Query("SELECT * FROM LocalRecord WHERE owner=:owner AND entity=:entity") abstract fun observe(owner:String,entity:String):Flow<List<LocalRecord>>
 @Query("SELECT * FROM LocalRecord WHERE owner=:owner AND entity=:entity AND id=:id") abstract suspend fun record(owner:String,entity:String,id:String):LocalRecord?
 @Insert(onConflict=OnConflictStrategy.REPLACE) abstract suspend fun put(record:LocalRecord)
 @Insert abstract suspend fun queue(mutation:PendingMutation)
 @Query("SELECT * FROM PendingMutation WHERE owner=:owner AND (state='pending' OR (state='in_flight' AND leaseUntil<:now)) ORDER BY createdAt,mutationId LIMIT 1") abstract suspend fun next(owner:String,now:Long):PendingMutation?
 @Query("UPDATE PendingMutation SET state='in_flight',leaseUntil=:until WHERE mutationId=:id") abstract suspend fun lease(id:String,until:Long)
 @Query("UPDATE PendingMutation SET state=:state,error=:error,leaseUntil=0 WHERE mutationId=:id") abstract suspend fun state(id:String,state:String,error:String?)
 @Query("DELETE FROM PendingMutation WHERE mutationId=:id") abstract suspend fun remove(id:String)
 @Query("SELECT COUNT(*) FROM PendingMutation WHERE owner=:owner AND entity=:entity AND recordId=:id") abstract suspend fun pending(owner:String,entity:String,id:String):Int
 @Query("SELECT revision FROM SyncCursor WHERE owner=:owner") abstract suspend fun cursor(owner:String):Long?
 @Insert(onConflict=OnConflictStrategy.REPLACE) abstract suspend fun cursor(cursor:SyncCursor)
 @Transaction open suspend fun enqueue(record:LocalRecord,command:String,payload:JSONObject){
  require(record.owner.isNotBlank());val mutation=PendingMutation(UUID.randomUUID().toString(),record.owner,record.entity,record.id,command,payload.toString(),System.currentTimeMillis())
  put(record.copy(syncState="pending"));queue(mutation)
 }
 @Transaction open suspend fun claim(owner:String):PendingMutation?{val now=System.currentTimeMillis();val op=next(owner,now)?:return null;lease(op.mutationId,now+60_000);return op}
 @Transaction open suspend fun apply(owner:String,changes:List<ServerRecord>,revision:Long){
  for(change in changes){val old=record(owner,change.entity,change.id);if(old!=null&&old.version>change.version)continue
   if(pending(owner,change.entity,change.id)>0&&old!=null)put(old.copy(serverPayload=change.payload,version=change.version))
   else put(LocalRecord(owner,change.entity,change.id,change.payload,change.payload,change.version,"saved"))
  };cursor(SyncCursor(owner,revision))
 }
 @Transaction open suspend fun reject(op:PendingMutation,message:String){state(op.mutationId,"conflict",message);record(op.owner,op.entity,op.recordId)?.let{put(it.copy(syncState="conflict"))}}
}
@Database(entities=[LocalRecord::class,PendingMutation::class,SyncCursor::class],version=1,exportSchema=true)
abstract class MvpDatabase:RoomDatabase(){abstract fun dao():MvpDao}
data class ServerRecord(val entity:String,val id:String,val version:Int,val payload:String)
data class SyncPage(val revision:Long,val records:List<ServerRecord>)
data class AuthSession(val owner:String,val accessToken:String)
class SyncFailure(val status:Int,message:String):Exception(message)
interface MvpTransport {
 // POST /rest/v1/rpc/mvp_command with p_mutation_id, p_command and p_data.
 // The JWT is user-scoped; a service-role key must never enter this app.
 suspend fun command(session:AuthSession,mutation:PendingMutation)
 // POST /rest/v1/rpc/mvp_sync; preserve all records in each returned revision.
 suspend fun sync(session:AuthSession,after:Long):SyncPage
}
interface SyncDependencies {val mvpDatabase:MvpDatabase;val mvpTransport:MvpTransport;fun currentSession():AuthSession?}
class MvpSyncWorker(context:Context,params:WorkerParameters):CoroutineWorker(context,params){
 override suspend fun doWork():Result {
  val deps=applicationContext as? SyncDependencies?:return Result.failure()
  val owner=inputData.getString("owner")?:return Result.failure();val session=deps.currentSession()?:return Result.success()
  if(session.owner!=owner)return Result.success() // Await this owner's next sign-in.
  val dao=deps.mvpDatabase.dao();var active:PendingMutation?=null
  try{
   repeat(50){
    if(deps.currentSession()?.owner!=owner)return Result.success()
    val op=dao.claim(owner)?:return@repeat;active=op
    try{deps.mvpTransport.command(session,op);dao.remove(op.mutationId)}catch(e:SyncFailure){
     if(e.status==401){dao.state(op.mutationId,"pending",e.message);return Result.success()}
     if(e.status==409||e.status==400||e.status==403){dao.reject(op,e.message?:"Review this change");return Result.success()}
     dao.state(op.mutationId,"pending",e.message);return Result.retry()
    };active=null
   }
   // UI always observes Room. Reconcile canonical rows after acknowledgements.
   var cursor=dao.cursor(owner)?:0L
   repeat(20){val page=deps.mvpTransport.sync(session,cursor);dao.apply(owner,page.records,page.revision);if(page.revision==cursor)return Result.success();cursor=page.revision}
   return Result.retry()
  }catch(e:Exception){active?.let{dao.state(it.mutationId,"pending",e.message)};return Result.retry()}
 }
 companion object{fun schedule(context:Context,owner:String){val request=OneTimeWorkRequestBuilder<MvpSyncWorker>().setInputData(workDataOf("owner" to owner)).setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()).setBackoffCriteria(BackoffPolicy.EXPONENTIAL,30,TimeUnit.SECONDS).build();WorkManager.getInstance(context).enqueueUniqueWork("pkos-sync:$owner",ExistingWorkPolicy.KEEP,request)}}
}
