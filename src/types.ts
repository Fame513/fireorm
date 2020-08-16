import { OrderByDirection, DocumentReference } from '@google-cloud/firestore';
import { FirestoreBatch } from './Batch/FirestoreBatch';
import { FirestoreBatchSingleRepository } from './Batch/FirestoreBatchSingleRepository';

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type WithOptionalId<T extends { id: unknown }> = Pick<T, Exclude<keyof T, 'id'>> &
  Partial<Pick<T, 'id'>>;

export type IFirestoreVal = string | number | Date | boolean | DocumentReference;

export enum FirestoreOperators {
  equal = '==',
  lessThan = '<',
  greaterThan = '>',
  lessThanEqual = '<=',
  greaterThanEqual = '>=',
  arrayContains = 'array-contains',
}

export interface IFireOrmQueryLine {
  prop: string;
  val: IFirestoreVal;
  operator: FirestoreOperators;
}

export interface IOrderByParams {
  fieldPath: string;
  directionStr: OrderByDirection;
}

export type IQueryBuilderResult = IFireOrmQueryLine[];

export type IWherePropParam<T> = keyof T | ((t: T) => unknown);

export interface IQueryable<T extends IEntity> {
  whereEqualTo(prop: IWherePropParam<T>, val: IFirestoreVal): IQueryBuilder<T>;
  whereGreaterThan(prop: IWherePropParam<T>, val: IFirestoreVal): IQueryBuilder<T>;
  whereGreaterOrEqualThan(prop: IWherePropParam<T>, val: IFirestoreVal): IQueryBuilder<T>;
  whereLessThan(prop: IWherePropParam<T>, val: IFirestoreVal): IQueryBuilder<T>;
  whereLessOrEqualThan(prop: IWherePropParam<T>, val: IFirestoreVal): IQueryBuilder<T>;
  whereArrayContains(prop: IWherePropParam<T>, val: IFirestoreVal): IQueryBuilder<T>;
  find(): Promise<T[]>;
  findOne(): Promise<T | null>;
}

export interface IOrderable<T extends IEntity> {
  orderByAscending(prop: IWherePropParam<T>): IQueryBuilder<T>;
  orderByDescending(prop: IWherePropParam<T>): IQueryBuilder<T>;
}

export interface ILimitable<T extends IEntity> {
  limit(limitVal: number): IQueryBuilder<T>;
}

export type IQueryBuilder<T extends IEntity> = IQueryable<T> & IOrderable<T> & ILimitable<T>;

export interface IQueryExecutor<T> {
  execute(
    queries: IFireOrmQueryLine[],
    limitVal?: number,
    orderByObj?: IOrderByParams,
    single?: boolean
  ): Promise<T[]>;
}

export interface IBatchRepository<T extends IEntity> {
  create(item: WithOptionalId<T>): void;
  update(item: T): void;
  delete(item: T): void;
}

export interface ISingleBatchRepository<T extends IEntity> extends IBatchRepository<T> {
  commit(): Promise<unknown>;
}

export interface IBaseRepository<T extends IEntity> {
  findById(id: string): Promise<T | null>;
  create(item: PartialBy<T, 'id'>): Promise<T>;
  update(item: T): Promise<T>;
  delete(id: string): Promise<void>;
}

export type IRepository<T extends IEntity> = IBaseRepository<T> &
  IQueryBuilder<T> &
  IQueryExecutor<T>;

// TODO: shouldn't this be in IRepository?
export type ISubCollection<T extends IEntity> = IRepository<T> & {
  createBatch: () => FirestoreBatchSingleRepository<T>;
};

export interface IEntity {
  id: string;
}

export type Constructor<T> = { new (): T };
export type IEntityConstructor = Constructor<IEntity>;
export type IEntityRepositoryConstructor = Constructor<IRepository<IEntity>>;
