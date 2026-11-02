import { useEffect, useState } from "react";
import { fetchRecord } from "@/lib/entityConfig";

// Resolves a pack's {type,id} items into records, dropping missing or other-workspace records.
export default function usePackRecords(pack) {
  const [records, setRecords] = useState(null);
  const key = JSON.stringify(pack?.items || []);

  useEffect(() => {
    if (!pack) return;
    Promise.all((pack.items || []).map(async (i) => ({ ...i, record: await fetchRecord(i.type, i.id) }))).then((list) =>
      setRecords(list.filter((x) => x.record && x.record.workspace === pack.workspace))
    );
  }, [key, pack?.workspace]);

  return records;
}