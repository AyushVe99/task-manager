import poolMonitor from '../utils/poolMonitor.js';
import { AsyncLocalStorage } from 'async_hooks';

// Create async local storage to track request context
export const requestContext = new AsyncLocalStorage();

// Mongoose plugin to track database calls
export const dbCallTrackerPlugin = (schema) => {
    // Track all query operations
    const operations = ['find', 'findOne', 'findById', 'countDocuments', 'estimatedDocumentCount'];

    operations.forEach(operation => {
        schema.pre(operation, function () {
            const store = requestContext.getStore();
            if (store && store.requestId) {
                poolMonitor.trackDBCall(store.requestId);
            }
        });
    });

    // Track save operations
    schema.pre('save', function () {
        const store = requestContext.getStore();
        if (store && store.requestId) {
            poolMonitor.trackDBCall(store.requestId);
        }
    });

    // Track update operations
    const updateOps = ['updateOne', 'updateMany', 'findOneAndUpdate', 'findByIdAndUpdate'];
    updateOps.forEach(operation => {
        schema.pre(operation, function () {
            const store = requestContext.getStore();
            if (store && store.requestId) {
                poolMonitor.trackDBCall(store.requestId);
            }
        });
    });

    // Track delete operations
    const deleteOps = ['deleteOne', 'deleteMany', 'findOneAndDelete', 'findByIdAndDelete'];
    deleteOps.forEach(operation => {
        schema.pre(operation, function () {
            const store = requestContext.getStore();
            if (store && store.requestId) {
                poolMonitor.trackDBCall(store.requestId);
            }
        });
    });
};
