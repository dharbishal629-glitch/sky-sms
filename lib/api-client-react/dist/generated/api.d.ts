import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { Account, AdminOverview, Availability, CreatePaymentRequest, CreateRentalRequest, Dashboard, GetAvailabilityParams, HealthStatus, ListAdminTransactions200, ListAdminUsers200, ListCountries200, ListPayments200, ListRentals200, ListServices200, ListServicesParams, PaymentCheckout, Rental } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get the current account
 */
export declare const getGetMeUrl: () => string;
export declare const getMe: (options?: RequestInit) => Promise<Account>;
export declare const getGetMeQueryKey: () => readonly ["/api/me"];
export declare const getGetMeQueryOptions: <TData = Awaited<ReturnType<typeof getMe>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMeQueryResult = NonNullable<Awaited<ReturnType<typeof getMe>>>;
export type GetMeQueryError = ErrorType<unknown>;
/**
 * @summary Get the current account
 */
export declare function useGetMe<TData = Awaited<ReturnType<typeof getMe>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get user dashboard data
 */
export declare const getGetDashboardUrl: () => string;
export declare const getDashboard: (options?: RequestInit) => Promise<Dashboard>;
export declare const getGetDashboardQueryKey: () => readonly ["/api/dashboard"];
export declare const getGetDashboardQueryOptions: <TData = Awaited<ReturnType<typeof getDashboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDashboard>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDashboardQueryResult = NonNullable<Awaited<ReturnType<typeof getDashboard>>>;
export type GetDashboardQueryError = ErrorType<unknown>;
/**
 * @summary Get user dashboard data
 */
export declare function useGetDashboard<TData = Awaited<ReturnType<typeof getDashboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List available countries
 */
export declare const getListCountriesUrl: () => string;
export declare const listCountries: (options?: RequestInit) => Promise<ListCountries200>;
export declare const getListCountriesQueryKey: () => readonly ["/api/catalog/countries"];
export declare const getListCountriesQueryOptions: <TData = Awaited<ReturnType<typeof listCountries>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCountries>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listCountries>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListCountriesQueryResult = NonNullable<Awaited<ReturnType<typeof listCountries>>>;
export type ListCountriesQueryError = ErrorType<unknown>;
/**
 * @summary List available countries
 */
export declare function useListCountries<TData = Awaited<ReturnType<typeof listCountries>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCountries>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List available services
 */
export declare const getListServicesUrl: (params?: ListServicesParams) => string;
export declare const listServices: (params?: ListServicesParams, options?: RequestInit) => Promise<ListServices200>;
export declare const getListServicesQueryKey: (params?: ListServicesParams) => readonly ["/api/catalog/services", ...ListServicesParams[]];
export declare const getListServicesQueryOptions: <TData = Awaited<ReturnType<typeof listServices>>, TError = ErrorType<unknown>>(params?: ListServicesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listServices>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listServices>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListServicesQueryResult = NonNullable<Awaited<ReturnType<typeof listServices>>>;
export type ListServicesQueryError = ErrorType<unknown>;
/**
 * @summary List available services
 */
export declare function useListServices<TData = Awaited<ReturnType<typeof listServices>>, TError = ErrorType<unknown>>(params?: ListServicesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listServices>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get live service availability
 */
export declare const getGetAvailabilityUrl: (params: GetAvailabilityParams) => string;
export declare const getAvailability: (params: GetAvailabilityParams, options?: RequestInit) => Promise<Availability>;
export declare const getGetAvailabilityQueryKey: (params?: GetAvailabilityParams) => readonly ["/api/catalog/availability", ...GetAvailabilityParams[]];
export declare const getGetAvailabilityQueryOptions: <TData = Awaited<ReturnType<typeof getAvailability>>, TError = ErrorType<unknown>>(params: GetAvailabilityParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAvailability>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAvailability>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAvailabilityQueryResult = NonNullable<Awaited<ReturnType<typeof getAvailability>>>;
export type GetAvailabilityQueryError = ErrorType<unknown>;
/**
 * @summary Get live service availability
 */
export declare function useGetAvailability<TData = Awaited<ReturnType<typeof getAvailability>>, TError = ErrorType<unknown>>(params: GetAvailabilityParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAvailability>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List user rentals
 */
export declare const getListRentalsUrl: () => string;
export declare const listRentals: (options?: RequestInit) => Promise<ListRentals200>;
export declare const getListRentalsQueryKey: () => readonly ["/api/rentals"];
export declare const getListRentalsQueryOptions: <TData = Awaited<ReturnType<typeof listRentals>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listRentals>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listRentals>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListRentalsQueryResult = NonNullable<Awaited<ReturnType<typeof listRentals>>>;
export type ListRentalsQueryError = ErrorType<unknown>;
/**
 * @summary List user rentals
 */
export declare function useListRentals<TData = Awaited<ReturnType<typeof listRentals>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listRentals>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Rent a SIM number
 */
export declare const getCreateRentalUrl: () => string;
export declare const createRental: (createRentalRequest: CreateRentalRequest, options?: RequestInit) => Promise<Rental>;
export declare const getCreateRentalMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createRental>>, TError, {
        data: BodyType<CreateRentalRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createRental>>, TError, {
    data: BodyType<CreateRentalRequest>;
}, TContext>;
export type CreateRentalMutationResult = NonNullable<Awaited<ReturnType<typeof createRental>>>;
export type CreateRentalMutationBody = BodyType<CreateRentalRequest>;
export type CreateRentalMutationError = ErrorType<unknown>;
/**
 * @summary Rent a SIM number
 */
export declare const useCreateRental: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createRental>>, TError, {
        data: BodyType<CreateRentalRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createRental>>, TError, {
    data: BodyType<CreateRentalRequest>;
}, TContext>;
/**
 * @summary Refresh SMS messages for a rental
 */
export declare const getRefreshRentalUrl: (id: string) => string;
export declare const refreshRental: (id: string, options?: RequestInit) => Promise<Rental>;
export declare const getRefreshRentalMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof refreshRental>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof refreshRental>>, TError, {
    id: string;
}, TContext>;
export type RefreshRentalMutationResult = NonNullable<Awaited<ReturnType<typeof refreshRental>>>;
export type RefreshRentalMutationError = ErrorType<unknown>;
/**
 * @summary Refresh SMS messages for a rental
 */
export declare const useRefreshRental: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof refreshRental>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof refreshRental>>, TError, {
    id: string;
}, TContext>;
/**
 * @summary Cancel a rental
 */
export declare const getCancelRentalUrl: (id: string) => string;
export declare const cancelRental: (id: string, options?: RequestInit) => Promise<Rental>;
export declare const getCancelRentalMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof cancelRental>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof cancelRental>>, TError, {
    id: string;
}, TContext>;
export type CancelRentalMutationResult = NonNullable<Awaited<ReturnType<typeof cancelRental>>>;
export type CancelRentalMutationError = ErrorType<unknown>;
/**
 * @summary Cancel a rental
 */
export declare const useCancelRental: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof cancelRental>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof cancelRental>>, TError, {
    id: string;
}, TContext>;
/**
 * @summary List user payments
 */
export declare const getListPaymentsUrl: () => string;
export declare const listPayments: (options?: RequestInit) => Promise<ListPayments200>;
export declare const getListPaymentsQueryKey: () => readonly ["/api/payments"];
export declare const getListPaymentsQueryOptions: <TData = Awaited<ReturnType<typeof listPayments>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPayments>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listPayments>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListPaymentsQueryResult = NonNullable<Awaited<ReturnType<typeof listPayments>>>;
export type ListPaymentsQueryError = ErrorType<unknown>;
/**
 * @summary List user payments
 */
export declare function useListPayments<TData = Awaited<ReturnType<typeof listPayments>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPayments>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create an OxaPay checkout
 */
export declare const getCreatePaymentCheckoutUrl: () => string;
export declare const createPaymentCheckout: (createPaymentRequest: CreatePaymentRequest, options?: RequestInit) => Promise<PaymentCheckout>;
export declare const getCreatePaymentCheckoutMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createPaymentCheckout>>, TError, {
        data: BodyType<CreatePaymentRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createPaymentCheckout>>, TError, {
    data: BodyType<CreatePaymentRequest>;
}, TContext>;
export type CreatePaymentCheckoutMutationResult = NonNullable<Awaited<ReturnType<typeof createPaymentCheckout>>>;
export type CreatePaymentCheckoutMutationBody = BodyType<CreatePaymentRequest>;
export type CreatePaymentCheckoutMutationError = ErrorType<unknown>;
/**
 * @summary Create an OxaPay checkout
 */
export declare const useCreatePaymentCheckout: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createPaymentCheckout>>, TError, {
        data: BodyType<CreatePaymentRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createPaymentCheckout>>, TError, {
    data: BodyType<CreatePaymentRequest>;
}, TContext>;
/**
 * @summary Get admin overview
 */
export declare const getGetAdminOverviewUrl: () => string;
export declare const getAdminOverview: (options?: RequestInit) => Promise<AdminOverview>;
export declare const getGetAdminOverviewQueryKey: () => readonly ["/api/admin/overview"];
export declare const getGetAdminOverviewQueryOptions: <TData = Awaited<ReturnType<typeof getAdminOverview>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAdminOverview>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAdminOverview>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAdminOverviewQueryResult = NonNullable<Awaited<ReturnType<typeof getAdminOverview>>>;
export type GetAdminOverviewQueryError = ErrorType<unknown>;
/**
 * @summary Get admin overview
 */
export declare function useGetAdminOverview<TData = Awaited<ReturnType<typeof getAdminOverview>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAdminOverview>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List users for admin
 */
export declare const getListAdminUsersUrl: () => string;
export declare const listAdminUsers: (options?: RequestInit) => Promise<ListAdminUsers200>;
export declare const getListAdminUsersQueryKey: () => readonly ["/api/admin/users"];
export declare const getListAdminUsersQueryOptions: <TData = Awaited<ReturnType<typeof listAdminUsers>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAdminUsers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAdminUsers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListAdminUsersQueryResult = NonNullable<Awaited<ReturnType<typeof listAdminUsers>>>;
export type ListAdminUsersQueryError = ErrorType<unknown>;
/**
 * @summary List users for admin
 */
export declare function useListAdminUsers<TData = Awaited<ReturnType<typeof listAdminUsers>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAdminUsers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List platform transactions
 */
export declare const getListAdminTransactionsUrl: () => string;
export declare const listAdminTransactions: (options?: RequestInit) => Promise<ListAdminTransactions200>;
export declare const getListAdminTransactionsQueryKey: () => readonly ["/api/admin/transactions"];
export declare const getListAdminTransactionsQueryOptions: <TData = Awaited<ReturnType<typeof listAdminTransactions>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAdminTransactions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAdminTransactions>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListAdminTransactionsQueryResult = NonNullable<Awaited<ReturnType<typeof listAdminTransactions>>>;
export type ListAdminTransactionsQueryError = ErrorType<unknown>;
/**
 * @summary List platform transactions
 */
export declare function useListAdminTransactions<TData = Awaited<ReturnType<typeof listAdminTransactions>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAdminTransactions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map