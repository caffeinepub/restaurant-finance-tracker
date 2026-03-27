import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Loader2,
  Pencil,
  Plus,
  Settings2,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Category, Transaction } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCategories,
  useTransactionTypes,
  useTransactions,
} from "../hooks/useQueries";

const CURRENCIES = ["EUR", "USD", "CNY"];

const CURRENCY_SYMBOL: Record<string, string> = {
  EUR: "€",
  USD: "$",
  CNY: "¥",
};

const PREDEFINED_TYPES = ["Prihod", "Rashod"];
const PREDEFINED_CATEGORIES: Category[] = [
  { name: "Hrana", txType: "Rashod" },
  { name: "Piće", txType: "Rashod" },
  { name: "Plaće", txType: "Rashod" },
  { name: "Najam", txType: "Rashod" },
  { name: "Komunalije", txType: "Rashod" },
  { name: "Ostalo", txType: "Rashod" },
];

const PAGE_SIZE = 10;

function formatDate(ts: bigint) {
  return new Date(Number(ts)).toLocaleDateString("hr-HR");
}

function formatAmount(amount: number, currency: string) {
  const symbol = CURRENCY_SYMBOL[currency] ?? currency;
  return `${symbol} ${amount.toLocaleString("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function mergeWithPredefined(
  backendList: Category[],
  predefined: Category[],
): Category[] {
  const all = [...predefined];
  for (const item of backendList) {
    if (!all.some((a) => a.name === item.name)) all.push(item);
  }
  return all;
}

function mergeTypesPredefined(backendList: string[], predefined: string[]) {
  const all = [...predefined];
  for (const item of backendList) {
    if (!all.includes(item)) all.push(item);
  }
  return all;
}

const PREDEFINED_CATEGORY_NAMES = new Set(
  PREDEFINED_CATEGORIES.map((c) => c.name),
);

// ─── Transaction Dialog (Add + Edit) ──────────────────────────────────────
function TransactionDialog({
  open,
  onOpenChange,
  editTransaction,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editTransaction?: Transaction;
}) {
  const isEdit = !!editTransaction;
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const qc = useQueryClient();
  const { data: backendCategories = [] } = useCategories();
  const { data: backendTypes = [] } = useTransactionTypes();
  const localStorageTypes: string[] = (() => {
    try {
      const stored = localStorage.getItem("rft_custom_types");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  })();

  const allTypes = mergeTypesPredefined(
    [...backendTypes, ...localStorageTypes],
    PREDEFINED_TYPES,
  );
  const allCategories = mergeWithPredefined(
    backendCategories,
    PREDEFINED_CATEGORIES,
  );

  const [txType, setTxType] = useState(
    isEdit ? editTransaction.transactionType : "",
  );
  const [amount, setAmount] = useState(
    isEdit ? String(editTransaction.amount) : "",
  );
  const [currency, setCurrency] = useState(
    isEdit ? editTransaction.currency : "EUR",
  );
  const [date, setDate] = useState(
    isEdit
      ? new Date(Number(editTransaction.date)).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  );
  const [description, setDescription] = useState(
    isEdit ? editTransaction.description : "",
  );
  const [category, setCategory] = useState(
    isEdit ? editTransaction.category : "",
  );
  const [saving, setSaving] = useState(false);

  const filteredCategories = allCategories.filter(
    (cat) => cat.txType === txType,
  );
  const hasCategories = filteredCategories.length > 0;

  const handleTxTypeChange = (value: string) => {
    setTxType(value);
    setCategory("");
  };

  const reset = () => {
    setAmount("");
    setCurrency("EUR");
    setDate(new Date().toISOString().split("T")[0]);
    setDescription("");
    setTxType("");
    setCategory("");
  };

  const handleOpenChange = (v: boolean) => {
    if (!v && !isEdit) reset();
    onOpenChange(v);
  };

  const handleSubmit = async () => {
    if (!actor) return;
    const parsed = Number.parseFloat(amount.replace(",", "."));
    if (Number.isNaN(parsed) || parsed <= 0) {
      toast.error("Unesite ispravan iznos.");
      return;
    }
    if (!txType) {
      toast.error("Odaberite tip transakcije.");
      return;
    }
    if (hasCategories && !category) {
      toast.error("Odaberite kategoriju.");
      return;
    }
    if (!description.trim()) {
      toast.error("Unesite opis.");
      return;
    }

    const principal = identity?.getPrincipal();
    if (!principal) {
      toast.error("Greška: korisnik nije prijavljen.");
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await actor.updateTransaction({
          id: editTransaction.id,
          amount: parsed,
          currency,
          date: BigInt(new Date(date).getTime()),
          description: description.trim(),
          transactionType: txType,
          category,
          createdBy: editTransaction.createdBy,
        });
        await qc.invalidateQueries({ queryKey: ["transactions"] });
        toast.success("Transakcija ažurirana.");
        onOpenChange(false);
      } else {
        await actor.addTransaction({
          id: 0n,
          amount: parsed,
          currency,
          date: BigInt(new Date(date).getTime()),
          description: description.trim(),
          transactionType: txType,
          category,
          createdBy: principal,
        });
        await qc.invalidateQueries({ queryKey: ["transactions"] });
        toast.success("Transakcija dodana.");
        reset();
        onOpenChange(false);
      }
    } catch (err) {
      console.error("transaction error:", err);
      toast.error(
        isEdit
          ? "Greška pri ažuriranju transakcije."
          : "Greška pri dodavanju transakcije.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        data-ocid={
          isEdit ? "edit_transaction.dialog" : "add_transaction.dialog"
        }
      >
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Uredi transakciju" : "Dodaj transakciju"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Izmijenite podatke o transakciji."
              : "Unesite podatke o novoj transakciji."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Step 1: Transaction type — always first */}
          <div className="space-y-1.5">
            <Label>Tip transakcije</Label>
            <Select value={txType} onValueChange={handleTxTypeChange}>
              <SelectTrigger
                data-ocid={
                  isEdit
                    ? "edit_transaction.type_select"
                    : "add_transaction.type_select"
                }
              >
                <SelectValue placeholder="Odaberi tip" />
              </SelectTrigger>
              <SelectContent>
                {allTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step 2: Category — filtered by selected type */}
          <div className="space-y-1.5">
            <Label>Kategorija</Label>
            {txType === "" ? (
              <p className="text-sm text-muted-foreground py-2">
                Najprije odaberite tip transakcije.
              </p>
            ) : hasCategories ? (
              <Select
                value={category}
                onValueChange={setCategory}
                disabled={!txType}
              >
                <SelectTrigger
                  data-ocid={
                    isEdit
                      ? "edit_transaction.category_select"
                      : "add_transaction.category_select"
                  }
                >
                  <SelectValue placeholder="Odaberi kategoriju" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p
                className="text-sm text-muted-foreground py-2"
                data-ocid={
                  isEdit
                    ? "edit_transaction.category_select"
                    : "add_transaction.category_select"
                }
              >
                Nema kategorija za ovaj tip. Dodajte vlastitu u upravljanju
                kategorijama.
              </p>
            )}
          </div>

          {/* Amount + Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tx-amount">Iznos</Label>
              <Input
                id="tx-amount"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                data-ocid={
                  isEdit ? "edit_transaction.input" : "add_transaction.input"
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Valuta</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger
                  data-ocid={
                    isEdit
                      ? "edit_transaction.select"
                      : "add_transaction.select"
                  }
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tx-date">Datum</Label>
            <Input
              id="tx-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              data-ocid={
                isEdit
                  ? "edit_transaction.date_input"
                  : "add_transaction.date_input"
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tx-desc">Opis</Label>
            <Input
              id="tx-desc"
              placeholder="Npr. Nabava namirnica"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-ocid={
                isEdit
                  ? "edit_transaction.description_input"
                  : "add_transaction.description_input"
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            data-ocid={
              isEdit
                ? "edit_transaction.cancel_button"
                : "add_transaction.cancel_button"
            }
          >
            Odustani
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            data-ocid={
              isEdit
                ? "edit_transaction.submit_button"
                : "add_transaction.submit_button"
            }
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Spremi" : "Dodaj"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Manage Types Dialog ───────────────────────────────────────────────────
function ManageTypesDialog({
  open,
  onOpenChange,
  backendTypes,
  onAdd,
  onDelete,
  transactions,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  backendTypes: string[];
  onAdd: (value: string) => Promise<void>;
  onDelete: (value: string) => Promise<void>;
  transactions: Transaction[];
}) {
  const [newItem, setNewItem] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingType, setDeletingType] = useState<string | null>(null);

  const allTypes = mergeTypesPredefined(backendTypes, PREDEFINED_TYPES);

  const handleAdd = async () => {
    if (!newItem.trim()) return;
    setSaving(true);
    try {
      await onAdd(newItem.trim());
      setNewItem("");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (typeName: string) => {
    const inUse = transactions.some((tx) => tx.transactionType === typeName);
    if (inUse) {
      toast.error("Tip se koristi u transakcijama i ne može se obrisati.");
      return;
    }
    setDeletingType(typeName);
    try {
      await onDelete(typeName);
    } finally {
      setDeletingType(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" data-ocid="manage_types.dialog">
        <DialogHeader>
          <DialogTitle>Upravljanje tipovima</DialogTitle>
          <DialogDescription>
            Dodajte vlastite tipove transakcija uz predefiniranih.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1 min-h-[40px]">
            {allTypes.length === 0 && (
              <p
                className="text-sm text-muted-foreground"
                data-ocid="manage_types.empty_state"
              >
                Nema unesenih stavki.
              </p>
            )}
            {allTypes.map((typeName) => {
              const isPredefined = PREDEFINED_TYPES.includes(typeName);
              return (
                <div
                  key={typeName}
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1 hover:bg-muted/30 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="text-xs">
                      {typeName}
                    </Badge>
                    {isPredefined && (
                      <span className="text-[10px] text-muted-foreground">
                        (preddefinirano)
                      </span>
                    )}
                  </div>
                  {!isPredefined && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(typeName)}
                      disabled={deletingType === typeName}
                      data-ocid="manage_types.delete_button"
                    >
                      {deletingType === typeName ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t border-border pt-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Dodaj novi tip
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Novi tip..."
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                data-ocid="manage_types.input"
              />
              <Button
                onClick={handleAdd}
                disabled={saving || !newItem.trim()}
                data-ocid="manage_types.submit_button"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-ocid="manage_types.close_button"
          >
            Zatvori
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Manage Categories Dialog (with type selector + inline edit) ──────────
function ManageCategoriesDialog({
  open,
  onOpenChange,
  backendCategories,
  availableTypes,
  onAdd,
  onUpdate,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  backendCategories: Category[];
  onAdd: (name: string, txType: string) => Promise<void>;
  onUpdate: (
    oldName: string,
    newName: string,
    newTxType: string,
  ) => Promise<void>;
  availableTypes: string[];
  onDelete: (name: string) => Promise<void>;
}) {
  const [newName, setNewName] = useState("");
  const [newTxType, setNewTxType] = useState("Rashod");
  const [saving, setSaving] = useState(false);

  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTxType, setEditTxType] = useState("Rashod");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingCat, setDeletingCat] = useState<string | null>(null);

  const allCategories = mergeWithPredefined(
    backendCategories,
    PREDEFINED_CATEGORIES,
  );

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await onAdd(newName.trim(), newTxType);
      setNewName("");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (cat: Category) => {
    setEditingCat(cat.name);
    setEditName(cat.name);
    setEditTxType(cat.txType);
  };

  const cancelEdit = () => {
    setEditingCat(null);
    setEditName("");
    setEditTxType("Rashod");
  };

  const handleSaveEdit = async (oldName: string) => {
    if (!editName.trim()) return;
    setSavingEdit(true);
    try {
      await onUpdate(oldName, editName.trim(), editTxType);
      cancelEdit();
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        data-ocid="manage_categories.dialog"
      >
        <DialogHeader>
          <DialogTitle>Upravljanje kategorijama</DialogTitle>
          <DialogDescription>
            Dodajte vlastite kategorije uz predefiniranih.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1 min-h-[40px]">
            {allCategories.length === 0 && (
              <p
                className="text-sm text-muted-foreground"
                data-ocid="manage_categories.empty_state"
              >
                Nema unesenih stavki.
              </p>
            )}
            {allCategories.map((cat) => {
              const isPredefined = PREDEFINED_CATEGORY_NAMES.has(cat.name);

              if (!isPredefined && editingCat === cat.name) {
                return (
                  <div
                    key={cat.name}
                    className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-2"
                    data-ocid="manage_categories.edit_panel"
                  >
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-7 text-sm flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(cat.name);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      data-ocid="manage_categories.edit_name_input"
                    />
                    <Select value={editTxType} onValueChange={setEditTxType}>
                      <SelectTrigger
                        className="h-7 text-xs w-24"
                        data-ocid="manage_categories.edit_type_select"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTypes.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-primary"
                      onClick={() => handleSaveEdit(cat.name)}
                      disabled={savingEdit || !editName.trim()}
                      data-ocid="manage_categories.edit_save_button"
                    >
                      {savingEdit ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground"
                      onClick={cancelEdit}
                      data-ocid="manage_categories.edit_cancel_button"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              }

              return (
                <div
                  key={cat.name}
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1 hover:bg-muted/30 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="text-xs gap-1">
                      {cat.name}
                      <span className="opacity-60 text-[10px]">
                        ({cat.txType})
                      </span>
                    </Badge>
                    {isPredefined && (
                      <span className="text-[10px] text-muted-foreground">
                        (preddefinirano)
                      </span>
                    )}
                  </div>
                  {!isPredefined && (
                    <div className="flex items-center gap-0.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                        onClick={() => startEdit(cat)}
                        data-ocid="manage_categories.edit_button"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={async () => {
                          setDeletingCat(cat.name);
                          try {
                            await onDelete(cat.name);
                          } finally {
                            setDeletingCat(null);
                          }
                        }}
                        disabled={deletingCat === cat.name}
                        data-ocid="manage_categories.delete_button"
                      >
                        {deletingCat === cat.name ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t border-border pt-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Dodaj novu kategoriju
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs">Tip transakcije</Label>
              <Select value={newTxType} onValueChange={setNewTxType}>
                <SelectTrigger data-ocid="manage_categories.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Nova kategorija..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                data-ocid="manage_categories.input"
              />
              <Button
                onClick={handleAdd}
                disabled={saving || !newName.trim()}
                data-ocid="manage_categories.submit_button"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-ocid="manage_categories.close_button"
          >
            Zatvori
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export function TransactionsPage() {
  const { actor } = useActor();
  const qc = useQueryClient();

  const { data: transactions = [], isLoading: loadingTx } = useTransactions();
  const { data: backendCategories = [], refetch: refetchCategories } =
    useCategories();
  const { data: backendTypes = [] } = useTransactionTypes();

  const LS_KEY = "rft_custom_types";
  const [localCustomTypes, setLocalCustomTypes] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(localCustomTypes));
  }, [localCustomTypes]);

  const [addOpen, setAddOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<bigint | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Sort newest first
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateDiff = Number(b.date) - Number(a.date);
    if (dateDiff !== 0) return dateDiff;
    return Number(b.id) - Number(a.id);
  });

  const totalPages = Math.max(
    1,
    Math.ceil(sortedTransactions.length / PAGE_SIZE),
  );
  const paginatedTransactions = sortedTransactions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleDelete = async (id: bigint) => {
    if (!actor) return;
    setDeletingId(id);
    try {
      await actor.deleteTransaction(id);
      await qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transakcija obrisana.");
      if (paginatedTransactions.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      }
    } catch (err) {
      console.error("deleteTransaction error:", err);
      toast.error("Greška pri brisanju.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddCategory = async (name: string, txType: string) => {
    if (!actor) return;
    try {
      const ok = await actor.addCategory(name, txType);
      if (ok) {
        await refetchCategories();
        toast.success(`Kategorija "${name}" dodana.`);
      } else {
        toast.error("Kategorija već postoji.");
      }
    } catch (err) {
      console.error("addCategory error:", err);
      toast.error("Greška pri dodavanju kategorije.");
    }
  };

  const handleUpdateCategory = async (
    oldName: string,
    newName: string,
    newTxType: string,
  ) => {
    if (!actor) return;
    try {
      const ok = await actor.updateCategory(oldName, newName, newTxType);
      if (ok) {
        await refetchCategories();
        toast.success("Kategorija ažurirana.");
      } else {
        toast.error("Greška: kategorija nije pronađena.");
      }
    } catch (err) {
      console.error("updateCategory error:", err);
      toast.error("Greška pri ažuriranju kategorije.");
    }
  };

  const handleDeleteCategory = async (name: string) => {
    if (!actor) return;
    try {
      const ok = await actor.deleteCategory(name);
      if (ok) {
        await refetchCategories();
        toast.success(`Kategorija "${name}" obrisana.`);
      } else {
        toast.error("Greška: kategorija nije pronađena.");
      }
    } catch (err) {
      console.error("deleteCategory error:", err);
      toast.error("Greška pri brisanju kategorije.");
    }
  };

  const handleAddType = async (value: string) => {
    const allExisting = [
      ...PREDEFINED_TYPES,
      ...backendTypes,
      ...localCustomTypes,
    ];
    if (allExisting.includes(value)) {
      toast.error("Tip već postoji.");
      return;
    }
    setLocalCustomTypes((prev) => [...prev, value]);
    toast.success(`Tip "${value}" dodan.`);
  };

  const handleDeleteType = async (value: string) => {
    setLocalCustomTypes((prev) => prev.filter((t) => t !== value));
    toast.success(`Tip "${value}" obrisan.`);
  };

  return (
    <div className="space-y-6 animate-fade-in" data-ocid="transakcije.page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transakcije</h1>
          <p className="text-muted-foreground mt-1">
            Upravljanje prihodima i rashodima
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCatOpen(true)}
            data-ocid="transakcije.manage_categories.open_modal_button"
          >
            <Tag className="h-4 w-4 mr-1.5" />
            Kategorije
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTypeOpen(true)}
            data-ocid="transakcije.manage_types.open_modal_button"
          >
            <Settings2 className="h-4 w-4 mr-1.5" />
            Tipovi
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setAddOpen(true);
              setCurrentPage(1);
            }}
            data-ocid="transakcije.add_transaction.open_modal_button"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Dodaj transakciju
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card shadow-card overflow-hidden">
        <Table data-ocid="transakcije.table">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Datum
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Opis
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tip
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Kategorija
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">
                Iznos
              </TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingTx && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div
                    className="flex items-center justify-center gap-2 text-muted-foreground"
                    data-ocid="transakcije.loading_state"
                  >
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Učitavanje...</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!loadingTx && sortedTransactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16">
                  <div
                    className="flex flex-col items-center gap-2"
                    data-ocid="transakcije.empty_state"
                  >
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <Plus className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      Nema transakcija
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Kliknite &quot;Dodaj transakciju&quot; za unos prvog
                      zapisa.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!loadingTx &&
              paginatedTransactions.map((tx, i) => (
                <TableRow
                  key={String(tx.id)}
                  className="hover:bg-muted/30 transition-colors"
                  data-ocid={`transakcije.item.${(currentPage - 1) * PAGE_SIZE + i + 1}`}
                >
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(tx.date)}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground max-w-[200px] truncate">
                    {tx.description}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`text-xs border-0 ${
                        tx.transactionType.toLowerCase().includes("prihod")
                          ? "bg-teal/10 text-teal"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {tx.transactionType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {tx.category}
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-right whitespace-nowrap">
                    {formatAmount(tx.amount, tx.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setEditingTransaction(tx)}
                        data-ocid={`transakcije.edit_button.${(currentPage - 1) * PAGE_SIZE + i + 1}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(tx.id)}
                        disabled={deletingId === tx.id}
                        data-ocid={`transakcije.delete_button.${(currentPage - 1) * PAGE_SIZE + i + 1}`}
                      >
                        {deletingId === tx.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loadingTx && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Stranica {currentPage} od {totalPages} ({sortedTransactions.length}{" "}
            transakcija)
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  aria-disabled={currentPage === 1}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  aria-disabled={currentPage === totalPages}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <TransactionDialog open={addOpen} onOpenChange={setAddOpen} />

      <TransactionDialog
        key={
          editingTransaction
            ? `edit-${String(editingTransaction.id)}`
            : "edit-closed"
        }
        open={!!editingTransaction}
        onOpenChange={(v) => {
          if (!v) setEditingTransaction(null);
        }}
        editTransaction={editingTransaction ?? undefined}
      />

      <ManageCategoriesDialog
        open={catOpen}
        onOpenChange={setCatOpen}
        backendCategories={backendCategories}
        availableTypes={[...PREDEFINED_TYPES, ...localCustomTypes]}
        onAdd={handleAddCategory}
        onUpdate={handleUpdateCategory}
        onDelete={handleDeleteCategory}
      />

      <ManageTypesDialog
        open={typeOpen}
        onOpenChange={setTypeOpen}
        backendTypes={localCustomTypes}
        onAdd={handleAddType}
        onDelete={handleDeleteType}
        transactions={transactions}
      />
    </div>
  );
}
