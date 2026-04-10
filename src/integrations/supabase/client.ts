import { invokeFunction } from "@/integrations/firebase/functions";
import {
  countDocs,
  deleteDocById,
  getDocById,
  getOneDoc,
  listDocs,
  setDocById,
  updateDocById,
  type OrderClause,
  type WhereClause,
} from "@/integrations/firebase/firestore";
import { uploadFile, deleteFile, getFileUrl } from "@/integrations/firebase/storage";
import { clearSession, getSession } from "@/integrations/firebase/session";

type QueryOptions = {
  count?: "exact";
  head?: boolean;
};

class QueryBuilder<T = any> {
  private table: string;
  private filters: WhereClause[] = [];
  private orderByClause?: OrderClause;
  private limitCount?: number;
  private selectOptions?: QueryOptions;
  private orClauses: { field: string; op: "eq" | "is"; value: unknown }[] = [];
  private pendingUpdate: Partial<T> | null = null;
  private pendingDelete = false;

  constructor(table: string) {
    this.table = table;
  }

  select(_fields: string, options?: QueryOptions) {
    this.selectOptions = options;
    return this;
  }

  eq(field: string, value: unknown) {
    this.filters.push({ field, op: "==", value });
    return this;
  }

  gte(field: string, value: unknown) {
    this.filters.push({ field, op: ">=", value });
    return this;
  }

  lte(field: string, value: unknown) {
    this.filters.push({ field, op: "<=", value });
    return this;
  }

  gt(field: string, value: unknown) {
    this.filters.push({ field, op: ">", value });
    return this;
  }

  lt(field: string, value: unknown) {
    this.filters.push({ field, op: "<", value });
    return this;
  }

  neq(field: string, value: unknown) {
    this.filters.push({ field, op: "!=", value });
    return this;
  }

  in(field: string, values: unknown[]) {
    this.filters.push({ field, op: "in", value: values });
    return this;
  }

  or(conditions: string) {
    const parts = conditions.split(",").map((p) => p.trim()).filter(Boolean);
    parts.forEach((part) => {
      const [left, valueRaw] = part.split(".eq.");
      if (valueRaw !== undefined) {
        this.orClauses.push({ field: left, op: "eq", value: valueRaw });
        return;
      }
      if (part.endsWith(".is.null")) {
        const field = part.replace(".is.null", "");
        this.orClauses.push({ field, op: "is", value: null });
      }
    });
    return this;
  }

  order(field: string, opts?: { ascending?: boolean }) {
    this.orderByClause = { field, direction: opts?.ascending === false ? "desc" : "asc" };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  async maybeSingle() {
    const data = await getOneDoc<T>(this.table, this.filters, {
      orderBy: this.orderByClause,
    });
    return { data, error: null };
  }

  async single() {
    const data = await getOneDoc<T>(this.table, this.filters, {
      orderBy: this.orderByClause,
    });
    if (!data) {
      return { data: null, error: new Error("No rows") };
    }
    return { data, error: null };
  }

  async insert(values: T | T[]) {
    try {
      const rows = Array.isArray(values) ? values : [values];
      for (const row of rows as any[]) {
        const id = row.id ?? crypto.randomUUID();
        const created_at = row.created_at ?? new Date().toISOString();
        await setDocById(this.table, id, { ...row, id, created_at });
      }
      return { data: rows, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  update(values: Partial<T>) {
    this.pendingUpdate = values;
    return this;
  }

  delete() {
    this.pendingDelete = true;
    return this;
  }

  async execute() {
    try {
      if (this.pendingUpdate) {
        const values = this.pendingUpdate;
        // If updating by id, prefer direct update
        const idFilter = this.filters.find((f) => f.field === "id" && f.op === "==");
        if (idFilter) {
          await updateDocById(this.table, String(idFilter.value), values as any);
          return { data: null, error: null };
        }

        const docs = await listDocs<any>(this.table, {
          where: this.filters,
          orderBy: this.orderByClause,
          limit: this.limitCount,
        });
        for (const doc of docs) {
          await updateDocById(this.table, doc.id, values as any);
        }
        return { data: null, error: null };
      }

      if (this.pendingDelete) {
        const idFilter = this.filters.find((f) => f.field === "id" && f.op === "==");
        if (idFilter) {
          await deleteDocById(this.table, String(idFilter.value));
          return { data: null, error: null };
        }

        const docs = await listDocs<any>(this.table, {
          where: this.filters,
          orderBy: this.orderByClause,
          limit: this.limitCount,
        });
        for (const doc of docs) {
          await deleteDocById(this.table, doc.id);
        }
        return { data: null, error: null };
      }

      if (this.selectOptions?.count === "exact" && this.selectOptions.head) {
        const count = await countDocs(this.table, this.filters);
        return { data: null, count, error: null };
      }

      let data = await listDocs<T>(this.table, {
        where: this.filters,
        orderBy: this.orderByClause,
        limit: this.limitCount,
      });
      if (this.orClauses.length > 0) {
        data = (data as any[]).filter((row) =>
          this.orClauses.some((clause) => {
            if (clause.op === "eq") {
              return String((row as any)[clause.field]) === String(clause.value);
            }
            if (clause.op === "is") {
              return (row as any)[clause.field] == null;
            }
            return false;
          })
        ) as any;
      }
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

const auth = {
  async getUser() {
    const session = getSession();
    return { data: { user: session?.user ?? null } };
  },
  async getSession() {
    const session = getSession();
    return { data: { session } };
  },
  async signOut() {
    clearSession();
    return { error: null };
  },
  onAuthStateChange() {
    return { data: { subscription: { unsubscribe: () => {} } } };
  },
};

const storage = {
  from(bucket: string) {
    return {
      async upload(path: string, file: File) {
        try {
          await uploadFile(bucket, path, file);
          return { data: { path }, error: null };
        } catch (error: any) {
          return { data: null, error };
        }
      },
      async remove(paths: string[]) {
        try {
          for (const path of paths) {
            await deleteFile(bucket, path);
          }
          return { data: null, error: null };
        } catch (error: any) {
          return { data: null, error };
        }
      },
      async getPublicUrl(path: string) {
        try {
          const url = await getFileUrl(bucket, path);
          return { data: { publicUrl: url }, error: null };
        } catch (error: any) {
          return { data: { publicUrl: "" }, error };
        }
      },
    };
  },
};

const functions = {
  async invoke<TResponse>(name: string, { body }: { body: Record<string, unknown> }) {
    try {
      const data = await invokeFunction<TResponse>(name, body);
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  },
};

const channel = (_name: string) => {
  return {
    on: () => channel(_name),
    subscribe: () => ({ unsubscribe: () => {} }),
  };
};

export const supabase = {
  auth,
  storage,
  functions,
  channel,
  removeChannel: () => {},
  from(table: string) {
    const builder = new QueryBuilder(table);
    return builder as any;
  },
};

export default supabase;
