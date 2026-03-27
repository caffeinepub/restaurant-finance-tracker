import Map "mo:core/Map";
import List "mo:core/List";
import Float "mo:core/Float";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Bool "mo:core/Bool";

import Runtime "mo:core/Runtime";
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

  // State
  let accessControlState = AccessControl.initState();
  let transactions = Map.empty<Nat, Transaction>();
  let categories = List.fromArray(["Hrana", "Piće", "Plaće", "Najam", "Komunalije", "Ostalo"]);
  let transactionTypes = List.fromArray(["Prihod", "Rashod"]);
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

    // Admins can see all transactions, regular users only see their own
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

    // Check if transaction exists and verify ownership
    switch (transactions.get(id)) {
      case null { false };
      case (?transaction) {
        // Only the creator or an admin can delete the transaction
        if (transaction.createdBy != caller and not (AccessControl.isAdmin(accessControlState, caller))) {
          Runtime.trap("Unauthorized: Can only delete your own transactions");
        };
        transactions.remove(id);
        true;
      };
    };
  };

  // Category Management
  public shared ({ caller }) func addCategory(category : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add categories");
    };
    let exists = categories.any(func(c) { Text.equal(c, category) });
    if (exists) { false } else {
      categories.add(category);
      true;
    };
  };

  public query ({ caller }) func getCategories() : async [Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get categories");
    };
    categories.toArray();
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

  public query ({ caller }) func getTransactionTypes() : async [Text] {
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
