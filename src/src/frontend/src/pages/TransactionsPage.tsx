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
import { Loader2, Pencil, Plus, Settings2, Tag, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Transaction } from "../backend.d";
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
const PREDEFINED_CATEGORIES = [
  "Hrana",
  "Piće",
  "Plaće",
  "Najam",
  "Komunalije",
  "Ostalo",
];

const PAGE_SIZE = 10;

function formatDate(ts: bigint) {
  return new Date(Number(ts)).toLocaleDateString("hr-HR");
}

function formatAmount(amount: number, currency: string) {
  const symbol = CURRENCY_SYMBOL[currency] ?? currency;
  return `${symbol} ${amount.toLocaleString("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function mergeWithPredefined(backendList: string[], predefined: string[]) {
  const all = [...predefined];
  for (const item of backendList) {
    if (!all.includes(item)) all.push(item);
  }
  return all;
}

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

  const allTypes = mergeWithPredefined(backendTypes, PREDEFINED_TYPES);
  const allCategories = mergeWithPredefined(
    backendCategories,
    PREDEFINED_CATEGORIES,
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
  const [txType, setTxType] = useState(
    isEdit ? editTransaction.transactionType : "",
  );
  const [category, setCategory] = useState(
    isEdit ? editTransaction.category : "",
  );
  const [saving, setSaving] = useState(false);

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
    if (!category) {
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tip transakcije</Label>
              <Select value={txType} onValueChange={setTxType}>
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
            <div className="space-y-1.5">
              <Label>Kategorija</Label>
              <Select value={category} onValueChange={setCategory}>
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
                  {allCategories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

// ─── Manage List Dialog ───────────────────────────────────────────────────
function ManageListDialog({
  open,
  onOpenChange,
  title,
  description,
  items,
  predefinedItems,
  onAdd,
  inputPlaceholder,
  ocidPrefix,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  items: string[];
  predefinedItems: string[];
  onAdd: (value: string) => Promise<void>;
  inputPlaceholder: string;
  ocidPrefix: string;
}) {
  const [newItem, setNewItem] = useState("");
  const [saving, setSaving] = useState(false);

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

  const allItems = mergeWithPredefined(items, predefinedItems);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" data-ocid={`${ocidPrefix}.dialog`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 min-h-[40px]">
            {allItems.length === 0 && (
              <p
                className="text-sm text-muted-foreground"
                data-ocid={`${ocidPrefix}.empty_state`}
              >
                Nema unesenih stavki.
              </p>
            )}
            {allItems.map((item) => (
              <Badge key={item} variant="secondary" className="text-xs">
                {item}
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder={inputPlaceholder}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              data-ocid={`${ocidPrefix}.input`}
            />
            <Button
              onClick={handleAdd}
              disabled={saving || !newItem.trim()}
              data-ocid={`${ocidPrefix}.submit_button`}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-ocid={`${ocidPrefix}.close_button`}
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
  const { data: backendTypes = [], refetch: refetchTypes } =
    useTransactionTypes();

  const [addOpen, setAddOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<bigint | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Sort newest first
  const sortedTransactions = [...transactions].sort(
    (a, b) => Number(b.date) - Number(a.date),
  );

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
      // If last item on page and not first page, go back one page
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

  const handleAddCategory = async (value: string) => {
    if (!actor) return;
    try {
      const ok = await actor.addCategory(value);
      if (ok) {
        await refetchCategories();
        toast.success(`Kategorija "${value}" dodana.`);
      } else {
        toast.error("Kategorija već postoji.");
      }
    } catch (err) {
      console.error("addCategory error:", err);
      toast.error("Greška pri dodavanju kategorije.");
    }
  };

  const handleAddType = async (value: string) => {
    if (!actor) return;
    try {
      const ok = await actor.addTransactionType(value);
      if (ok) {
        await refetchTypes();
        toast.success(`Tip "${value}" dodan.`);
      } else {
        toast.error("Tip već postoji.");
      }
    } catch (err) {
      console.error("addTransactionType error:", err);
      toast.error("Greška pri dodavanju tipa.");
    }
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

      <ManageListDialog
        open={catOpen}
        onOpenChange={setCatOpen}
        title="Upravljanje kategorijama"
        description="Dodajte vlastite kategorije uz predefiniranih."
        items={backendCategories}
        predefinedItems={PREDEFINED_CATEGORIES}
        onAdd={handleAddCategory}
        inputPlaceholder="Nova kategorija..."
        ocidPrefix="manage_categories"
      />

      <ManageListDialog
        open={typeOpen}
        onOpenChange={setTypeOpen}
        title="Upravljanje tipovima"
        description="Dodajte vlastite tipove transakcija uz predefiniranih."
        items={backendTypes}
        predefinedItems={PREDEFINED_TYPES}
        onAdd={handleAddType}
        inputPlaceholder="Novi tip..."
        ocidPrefix="manage_types"
      />
    </div>
  );
}
