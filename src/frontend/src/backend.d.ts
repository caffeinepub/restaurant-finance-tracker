import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Category {
    name: string;
    txType: string;
}
export type TransactionType = string;
export interface UserProfile {
    name: string;
    restaurantName: string;
}
export interface Transaction {
    id: bigint;
    transactionType: string;
    date: bigint;
    createdBy: Principal;
    description: string;
    currency: string;
    category: string;
    amount: number;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCategory(name: string, txType: string): Promise<boolean>;
    addTransaction(transaction: Transaction): Promise<bigint>;
    addTransactionType(typeText: string): Promise<boolean>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteCategory(name: string): Promise<boolean>;
    deleteTransaction(id: bigint): Promise<boolean>;
    deleteTransactionType(typeText: string): Promise<boolean>;
    getAllUserProfiles(): Promise<Array<UserProfile>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCategories(): Promise<Array<Category>>;
    getTransactionTypes(): Promise<Array<TransactionType>>;
    getTransactions(): Promise<Array<Transaction>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateCategory(oldName: string, newName: string, newTxType: string): Promise<boolean>;
    updateTransaction(transaction: Transaction): Promise<boolean>;
}
