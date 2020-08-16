import { getMetadataStorage } from './MetadataStorage';
import { BaseFirestoreRepository } from './BaseFirestoreRepository';
import { IEntity, Constructor } from './types';
import { FirestoreTransaction } from './Transaction/FirestoreTransaction';
import { FirestoreBatch } from './Batch/FirestoreBatch';
import { Transaction } from '@google-cloud/firestore';

type RepositoryType = 'default' | 'base' | 'custom' | 'transaction';

function _getRepository<T extends IEntity = IEntity>(
  entityConstructorOrPath: Constructor<T> | string,
  repositoryType: RepositoryType,
  documentPath?: string
): BaseFirestoreRepository<T> {
  const metadataStorage = getMetadataStorage();

  if (!metadataStorage.firestoreRef) {
    throw new Error('Firestore must be initialized first');
  }

  const collection = metadataStorage.getCollection(entityConstructorOrPath);

  const isPath = typeof entityConstructorOrPath === 'string';
  const collectionName =
    typeof entityConstructorOrPath === 'string'
      ? entityConstructorOrPath
      : entityConstructorOrPath.name;

  // TODO: create tests
  if (!collection) {
    const error = isPath
      ? `'${collectionName}' is not a valid path for a collection`
      : `'${collectionName}' is not a valid collection`;
    throw new Error(error);
  }

  const repository = metadataStorage.getRepository(collection.entityConstructor);

  if (repositoryType === 'custom' && !repository) {
    throw new Error(`'${collectionName}' does not have a custom repository.`);
  }

  // If the collection has a parent, check that we have registered the parent
  if (collection.parentEntityConstructor) {
    const parentCollection = metadataStorage.getCollection(collection.parentEntityConstructor);

    if (!parentCollection) {
      throw new Error(`'${collectionName}' does not have a valid parent collection.`);
    }
  }

  if (repositoryType === 'custom' || (repositoryType === 'default' && repository)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (repository.target as any)(entityConstructorOrPath);
  } else {
    return new BaseFirestoreRepository<T>(entityConstructorOrPath);
  }
}

export function getRepository<T extends IEntity>(entityConstructorOrPath: Constructor<T> | string) {
  return _getRepository(entityConstructorOrPath, 'default');
}

export function getTransactionRepository<T extends IEntity>(
  entityConstructorOrPath: Constructor<T> | string,
  transaction: Transaction
) {
  return _getRepository(entityConstructorOrPath, 'transaction', transaction);
}

/**
 * @deprecated Use getRepository. This will be removed in a future version.
 */
export const GetRepository = getRepository;

export function getCustomRepository<T extends IEntity>(
  entity: Constructor<T>,
  documentPath?: string
) {
  return _getRepository(entity, 'custom', documentPath);
}

/**
 * @deprecated Use getCustomRepository. This will be removed in a future version.
 */
export const GetCustomRepository = getCustomRepository;

export function getBaseRepository<T extends IEntity>(
  entity: Constructor<T>,
  collectionPath?: string
) {
  return _getRepository(entity, 'base', collectionPath);
}

/**
 * @deprecated Use getBaseRepository. This will be removed in a future version.
 */
export const GetBaseRepository = getBaseRepository;

export const runTransaction = <T>(executor: (tran: FirestoreTransaction) => Promise<T>) => {
  const metadataStorage = getMetadataStorage();

  if (!metadataStorage.firestoreRef) {
    throw new Error('Firestore must be initialized first');
  }

  return metadataStorage.firestoreRef.runTransaction(async t => {
    return executor(new FirestoreTransaction(t));
  });
};

export const createBatch = () => {
  const metadataStorage = getMetadataStorage();

  if (!metadataStorage.firestoreRef) {
    throw new Error('Firestore must be initialized first');
  }

  return new FirestoreBatch(metadataStorage.firestoreRef);
};
