import { PFTx } from "./consts.ts";

const kv = await Deno.openKv();
export const DB = {
    SESSIONS:{
        delete:async(sessionId:string)=>{
            try {
                await kv.delete(["sessions",sessionId])
            } catch (error) {
                console.log(`Error Deleting ${error}`)
            }
        },
        create:async(sessionId:string, email:string):Promise<boolean>=>{
            try {
                const a = await kv.set(["sessions",sessionId],{email,createdAt:Date.now()},{expireIn:1000 * 60 * 60 * 24 * 2})
                if(!a.ok){throw new Error(`Couldnt create sessions`)}
                return true;
            } catch (error) {
                console.log(`Error creating session${error}`)
                return false;
            }
        },
        check:async(sessionId:string):Promise<any | null>=>{
            try {
                const b = await kv.get(["sessions",sessionId])
                if(b.value === null){throw new Error(`No Data found for doc: ${sessionId}`)}
                
                return b.value;
            } catch (error) {
                console.log(`Error Checking Session${error}`)
                return null;
            }
        }
    },
  create: async (coll: string, doc: string, data: any): Promise<boolean> => {
    try {
      const key = [coll, doc];

      const existing = await kv.get(key);
      if (existing.value !== null) {
        console.log(`Data with name "${name}" already exists.`);
        return false;
      }

      await kv.set(key, data);
      console.log(`Data created for "${doc} in the ${coll} collection".`);
      return true;
    } catch (error) {
      console.log(`Error DB Create: ${error}`);
      return false;
    }
  },
  read: async (coll: string, doc: string): Promise<any | null> => {
    try {
      const key = [coll, doc];

      const result = await kv.get(key);
      if (result.value === null) {
        throw new Error(`No data found for "${doc}".`);
      }

      // console.log(`Data for "${doc}":`, result.value);
      return result.value;
    } catch (error) {
      console.log(`Error DB READ ${error}`);
      return null;
    }
  },
  update: async (coll: string, doc: string, updates: any): Promise<boolean> => {
    try {
      const key = [coll, doc];

      const result = await kv.get(key);
      if (result.value === null) {
        throw new Error(`No data found for "${doc}".`);
      }

      const updatedData = { ...result.value, ...updates };
      await kv.set(key, updatedData);
      console.log(`Data updated for "${doc}".`);
      return true;
    } catch (error) {
      console.log(`Error DB UPDATE ${error}`);
      return false;
    }
  },
  delete: async (coll: string, doc: string): Promise<boolean> => {
    try {
      const key = [coll, doc];

      const result = await kv.get(key);
      if (result.value === null) {
        throw new Error(`No data found for "${doc}".`);
      }

      await kv.delete(key);
      console.log(`Data deleted for "${doc}".`);
      return true;
    } catch (error) {
      console.log(`Error DB UPDATE ${error}`);
      return false;
    }
  },
  listCollection: async (coll: string) => {
    const iterator = kv.list({ prefix: [coll] });

    console.log(`Listing all stored data in ${coll} collection:`);
    for await (const entry of iterator) {
      const key = entry.key.map(String).join(":"); // Convert each key part to a string
      console.log(`Name: ${key}, Data:`, entry.value);
    }
  },
  listAll: async () => {
    const iterator = kv.list({ prefix: [] }); // Use an empty array as the prefix selector

    console.log("Listing all stored data from all keys:");

    for await (const entry of iterator) {
      const key = entry.key.map(String).join(":"); // Convert key parts to strings
      console.log(
        `${"Key:"} ${key} ${"Value:"} ${JSON.stringify(entry.value, null, 2)}`
      );
    }
  },
  clearAllData: async (): Promise<boolean> => {
    try {
      const keys: Deno.KvKey[] = [];

      for await (const entry of kv.list({ prefix: [] })) {
        keys.push(entry.key);
      }

      for (const key of keys) {
        await kv.delete(key);
      }
      const dNames = await kv.set(["pfData","displayNames"], {all:["sample name"]});
      const minted = await kv.set(["pfData","minted"],{cards: ["defID"]})
      return true;
    } catch (error) {
      console.log(`ERROR CLEARING DATA: ${error}`);
      return false;
    }
  },
  getAllDataAsHtml: async (): Promise<string> => {
    const entries: { key: string; value: unknown }[] = [];
    try {
      // Scan the entire KV store
      for await (const entry of kv.list({ prefix: [] })) {
        entries.push({ key: entry.key.join(":"), value: entry.value });
      }

      // If no data is found
      if (entries.length === 0) {
        return `<p>No data found in KV store.</p>`;
      }

      // Generate HTML table
      const rows = entries
        .map(
          (entry) =>
            `<tr>
                    <td><strong>${entry.key}</strong></td>
                    <td>${JSON.stringify(entry.value, null, 2)}</td>
                  </tr>`
        )
        .join("");

      return `
              <table border="1" style="border-collapse: collapse; width: 100%; text-align: left;">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                </tbody>
              </table>
            `;
    } catch (error) {
      console.error("Error retrieving KV data:", error);
      return `<p>Error retrieving data: ${error}</p>`;
    }
  },
  sortLogs: () => {},
  tx: async (txs: PFTx[]): Promise<boolean> => {
    try {
      const key = ["logs", "all"];
      const result = await kv.get(key);
      if (result.value === null) {
        throw new Error(`No TX data found.`);
      }
      const allTxs = result.value as { txs: PFTx[] };
      // const newTxs = [...txs,...allTxs.txs];
      allTxs.txs = [...txs, ...allTxs.txs];
      await kv.set(key, allTxs);
      return true;
    } catch (error) {
      console.log(`Er sending TX ${error}`);
      return false;
    }
  },
  getAllFromCollection: async (coll: string) => {
    try {
      const dataArray: any[] = [];
      for await (const entry of kv.list({ prefix: [coll] })) {
        dataArray.push(entry.value);
      }
      return dataArray;
    } catch (error) {
      console.log(`Error gettin all from coll ${error}`);
      return null;
    }
  },
};
