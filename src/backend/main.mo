import Map "mo:core/Map";
import List "mo:core/List";
import Float "mo:core/Float";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Bool "mo:core/Bool";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";


// Specify data migration function in with-clause

actor {
  // Types and State
  public type Transaction = {
    id : Nat;
    amount : Float;
    currency : Text;
    date : Int;
    description : Text;
    transactionType : Text;
    category : Text;
    createdBy : Principal;
  };

  public type UserProfile = {
    name : Text;
    restaurantName : Text;
  };

  public type Category = {
    name : Text;
    txType : Text;
  };

  type TransactionType = Text;

  // State
  let accessControlState = AccessControl.initState();
  let transactions = Map.empty<Nat, Transaction>();
  let categories = Map.fromIter<Text, Category>([
    ("Hrana", { name = "Hrana"; txType = "Rashod" }),
    ("Pi\u{107}e", { name = "Pi\u{107}e"; txType = "Rashod" }),
    ("Pla\u{107}e", { name = "Pla\u{107}e"; txType = "Rashod" }),
    ("Najam", { name = "Najam"; txType = "Rashod" }),
    ("Komunalije", { name = "Komunalije"; txType = "Rashod" }),
    ("Ostalo", { name = "Ostalo"; txType = "Rashod" }),
  ].values());
  var transactionTypes = List.fromArray(["Prihod", "Rashod"]);
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Mixins : Authentication system with role-based access control
  include MixinAuthorization(accessControlState);

  // Transaction Management
  var nextTransactionId = 0;

  func isValidCurrency(currency : Text) : Bool {
    ["EUR", "USD", "CNY"].any(func(c) { Text.equal(c, currency) });
  };

  public shared ({ caller }) func addTransaction(transaction : Transaction) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add transactions");
    };

    let validatedCurrency = if (isValidCurrency(transaction.currency)) {
      transaction.currency;
    } else { "USD" };

    let newTransaction = {
      transaction with
      id = nextTransactionId;
      currency = validatedCurrency;
      createdBy = caller;
    };

    transactions.add(nextTransactionId, newTransaction);
    let currentId = nextTransactionId;
    nextTransactionId += 1;
    currentId;
  };

  public shared ({ caller }) func updateTransaction(transaction : Transaction) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update transactions");
    };

    switch (transactions.get(transaction.id)) {
      case null { false };
      case (?existing) {
        if (existing.createdBy != caller and not (AccessControl.isAdmin(accessControlState, caller))) {
          Runtime.trap("Unauthorized: Can only update your own transactions");
        };
        let validatedCurrency = if (isValidCurrency(transaction.currency)) {
          transaction.currency;
        } else { existing.currency };
        transactions.add(transaction.id, {
          transaction with
          currency = validatedCurrency;
          createdBy = existing.createdBy;
        });
        true;
      };
    };
  };

  public query ({ caller }) func getTransactions() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transactions");
    };

    if (AccessControl.isAdmin(accessControlState, caller)) {
      transactions.values().toArray();
    } else {
      transactions.values().filter(func(t) { t.createdBy == caller }).toArray();
    };
  };

  public shared ({ caller }) func deleteTransaction(id : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete transactions");
    };

    switch (transactions.get(id)) {
      case null { false };
      case (?transaction) {
        if (transaction.createdBy != caller and not (AccessControl.isAdmin(accessControlState, caller))) {
          Runtime.trap("Unauthorized: Can only delete your own transactions");
        };
        transactions.remove(id);
        true;
      };
    };
  };

  // Category Management
  public shared ({ caller }) func addCategory(name : Text, txType : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add categories");
    };
    let exists = categories.containsKey(name);
    if (exists) { false } else {
      categories.add(name, { name; txType });
      true;
    };
  };

  public shared ({ caller }) func updateCategory(oldName : Text, newName : Text, newTxType : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update categories");
    };
    switch (categories.get(oldName)) {
      case null { false };
      case (?_existing) {
        categories.remove(oldName);
        categories.add(newName, { name = newName; txType = newTxType });
        true;
      };
    };
  };

  public shared ({ caller }) func deleteCategory(name : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete categories");
    };
    switch (categories.get(name)) {
      case null { false };
      case (?_existing) {
        categories.remove(name);
        true;
      };
    };
  };

  public query ({ caller }) func getCategories() : async [Category] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get categories");
    };
    categories.values().toArray();
  };

  // Transaction Type Management
  public shared ({ caller }) func addTransactionType(typeText : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add transaction types");
    };
    let exists = transactionTypes.any(func(t) { Text.equal(t, typeText) });
    if (exists) { false } else {
      transactionTypes.add(typeText);
      true;
    };
  };

  public shared ({ caller }) func deleteTransactionType(typeText : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete transaction types");
    };
    let exists = transactionTypes.any(func(t) { Text.equal(t, typeText) });
    if (not exists) { false } else {
      let filtered = transactionTypes.values().filter(func(t) { not Text.equal(t, typeText) }).toArray();
      transactionTypes := List.fromArray(filtered);
      true;
    };
  };

  public query ({ caller }) func getTransactionTypes() : async [TransactionType] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get transaction types");
    };
    transactionTypes.toArray();
  };

  // User Profile Management
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can post profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can access other users' profiles");
    };
    userProfiles.get(user);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can post profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getAllUserProfiles() : async [UserProfile] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can list all profiles");
    };
    userProfiles.values().toArray();
  };
};
