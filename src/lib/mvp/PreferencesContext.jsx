import {createContext,useContext,useEffect,useLayoutEffect,useState} from 'react';
import {useAuth} from '@/lib/AuthContext';
import {readPreferences,setPreferenceOwner,writePreferences,applyAppearance} from './preferences';
const Context=createContext(null);
export function PreferencesProvider({children}){const {user}=useAuth(),[prefs,setPrefs]=useState(readPreferences);useLayoutEffect(()=>{setPreferenceOwner(user?.id);setPrefs(readPreferences(user?.id));const update=()=>setPrefs(readPreferences(user?.id));window.addEventListener('pkos:preferences',update);return()=>{window.removeEventListener('pkos:preferences',update);};},[user?.id]);useEffect(()=>{applyAppearance(prefs);const media=window.matchMedia('(prefers-color-scheme: dark)'),change=()=>applyAppearance(prefs);media.addEventListener('change',change);return()=>media.removeEventListener('change',change);},[prefs]);return <Context.Provider value={{prefs,save:values=>{const next=writePreferences(values,user?.id);setPrefs(next);return next;}}}>{children}</Context.Provider>;}
export const usePreferences=()=>useContext(Context);
