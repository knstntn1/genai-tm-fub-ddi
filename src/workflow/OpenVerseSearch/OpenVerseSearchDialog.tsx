import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import { Button } from '@genaitm/components/button/Button';
import { useVariant } from '@genaitm/util/variant';
import { useTranslation } from 'react-i18next';
import {
    OpenVerseSearchError,
    searchOpenVerseImages,
    type OpenVerseImageResult,
    type OpenVerseImageSearchResult,
    type SearchOpenVerseImagesOptions,
} from '@genaitm/util/openverse';
import styles from './OpenVerseSearchDialog.module.css';

type SearchClient = (options: SearchOpenVerseImagesOptions) => Promise<OpenVerseImageSearchResult>;

type SearchStatus = 'idle' | 'loading' | 'loading-more' | 'results' | 'empty' | 'error' | 'rate-limited';

interface RetryRequest {
    query: string;
    page: number;
}

interface Props {
    open: boolean;
    className: string;
    onClose: () => void;
    onUseImage: (result: OpenVerseImageResult) => void | Promise<void>;
    searchClient?: SearchClient;
}

export default function OpenVerseSearchDialog({
    open,
    className,
    onClose,
    onUseImage,
    searchClient = searchOpenVerseImages,
}: Props) {
    const { namespace } = useVariant();
    const { t } = useTranslation(namespace);
    const [query, setQuery] = useState('');
    const [submittedQuery, setSubmittedQuery] = useState('');
    const [results, setResults] = useState<OpenVerseImageResult[]>([]);
    const [page, setPage] = useState(0);
    const [pageCount, setPageCount] = useState(0);
    const [status, setStatus] = useState<SearchStatus>('idle');
    const [retryRequest, setRetryRequest] = useState<RetryRequest | null>(null);
    const [showEmptyQuery, setShowEmptyQuery] = useState(false);
    const [pendingUseIds, setPendingUseIds] = useState<Set<string>>(() => new Set());
    const [failedUseIds, setFailedUseIds] = useState<Set<string>>(() => new Set());
    const activeSearch = useRef<AbortController | null>(null);
    const requestId = useRef(0);

    const isSearching = status === 'loading' || status === 'loading-more';
    const canLoadMore = status === 'results' && page > 0 && page < pageCount;

    const abortActiveSearch = useCallback(() => {
        requestId.current += 1;
        activeSearch.current?.abort();
        activeSearch.current = null;
    }, []);

    const runSearch = useCallback(
        async (nextQuery: string, nextPage: number) => {
            abortActiveSearch();

            const controller = new AbortController();
            activeSearch.current = controller;
            const currentRequestId = requestId.current;

            setRetryRequest({ query: nextQuery, page: nextPage });
            setShowEmptyQuery(false);
            setStatus(nextPage === 1 ? 'loading' : 'loading-more');

            try {
                const response = await searchClient({
                    query: nextQuery,
                    page: nextPage,
                    signal: controller.signal,
                });

                if (controller.signal.aborted || currentRequestId !== requestId.current) return;

                setResults((currentResults) =>
                    nextPage === 1 ? response.results : [...currentResults, ...response.results]
                );
                setPage(response.page);
                setPageCount(response.pageCount);
                setSubmittedQuery(nextQuery);
                setRetryRequest(null);
                setStatus(response.results.length === 0 && nextPage === 1 ? 'empty' : 'results');
            } catch (error) {
                if (controller.signal.aborted || currentRequestId !== requestId.current) return;

                if (error instanceof OpenVerseSearchError && error.code === 'empty-query') {
                    setShowEmptyQuery(true);
                    setRetryRequest(null);
                    setStatus(results.length > 0 ? 'results' : 'idle');
                    return;
                }

                setStatus(error instanceof OpenVerseSearchError && error.code === 'rate-limited' ? 'rate-limited' : 'error');
            }
        },
        [abortActiveSearch, results.length, searchClient]
    );

    useEffect(() => {
        if (!open) {
            abortActiveSearch();
        }

        return () => {
            abortActiveSearch();
        };
    }, [abortActiveSearch, open]);

    const handleSubmit = useCallback(
        (event?: FormEvent<HTMLFormElement>) => {
            event?.preventDefault();
            const trimmedQuery = query.trim();

            if (trimmedQuery.length === 0 || isSearching) {
                setShowEmptyQuery(trimmedQuery.length === 0);
                return;
            }

            setResults([]);
            setPage(0);
            setPageCount(0);
            setFailedUseIds(new Set());
            void runSearch(trimmedQuery, 1);
        },
        [isSearching, query, runSearch]
    );

    const handleRetry = useCallback(() => {
        if (!retryRequest || isSearching) return;

        void runSearch(retryRequest.query, retryRequest.page);
    }, [isSearching, retryRequest, runSearch]);

    const handleLoadMore = useCallback(() => {
        if (!canLoadMore || submittedQuery.length === 0) return;

        void runSearch(submittedQuery, page + 1);
    }, [canLoadMore, page, runSearch, submittedQuery]);

    const handleClose = useCallback(() => {
        abortActiveSearch();
        onClose();
    }, [abortActiveSearch, onClose]);

    const handleUseImage = useCallback(
        async (result: OpenVerseImageResult) => {
            if (pendingUseIds.has(result.id)) return;

            setPendingUseIds((current) => new Set(current).add(result.id));
            setFailedUseIds((current) => {
                const next = new Set(current);
                next.delete(result.id);
                return next;
            });

            try {
                await onUseImage(result);
            } catch {
                setFailedUseIds((current) => new Set(current).add(result.id));
            } finally {
                setPendingUseIds((current) => {
                    const next = new Set(current);
                    next.delete(result.id);
                    return next;
                });
            }
        },
        [onUseImage, pendingUseIds]
    );

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth={false}
            slotProps={{ paper: { className: styles.dialogPaper } }}
        >
            <DialogTitle className={styles.dialogTitle}>
                {t('trainingdata.openverse.title', { className })}
                <IconButton
                    onClick={handleClose}
                    aria-label={t('trainingdata.aria.close')}
                    className={styles.closeButton}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent className={styles.dialogContent}>
                <form
                    className={styles.searchForm}
                    onSubmit={handleSubmit}
                >
                    <TextField
                        label={t('trainingdata.openverse.searchLabel')}
                        placeholder={t('trainingdata.openverse.searchPlaceholder')}
                        value={query}
                        onChange={(event) => {
                            setQuery(event.target.value);
                            setShowEmptyQuery(false);
                        }}
                        disabled={isSearching}
                        helperText={showEmptyQuery ? t('trainingdata.openverse.emptyQuery') : undefined}
                        className={styles.searchField}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isSearching || query.trim().length === 0}
                    >
                        {t('trainingdata.openverse.searchAction')}
                    </Button>
                </form>

                <div
                    aria-live="polite"
                    className={styles.stateRegion}
                >
                    {status === 'idle' && <Typography>{t('trainingdata.openverse.initial')}</Typography>}

                    {status === 'loading' && (
                        <div className={styles.loadingState}>
                            <CircularProgress size={24} />
                            <Typography>{t('trainingdata.openverse.loading')}</Typography>
                        </div>
                    )}

                    {status === 'empty' && (
                        <div className={styles.emptyState}>
                            <Typography className={styles.stateTitle}>{t('trainingdata.openverse.emptyTitle')}</Typography>
                            <Typography>{t('trainingdata.openverse.emptyBody')}</Typography>
                        </div>
                    )}

                    {(status === 'error' || status === 'rate-limited') && (
                        <Alert
                            severity={status === 'rate-limited' ? 'warning' : 'error'}
                            action={
                                <Button
                                    variant="outlined"
                                    onClick={handleRetry}
                                    disabled={isSearching}
                                >
                                    {t('trainingdata.openverse.retry')}
                                </Button>
                            }
                        >
                            {status === 'rate-limited'
                                ? t('trainingdata.openverse.rateLimit')
                                : t('trainingdata.openverse.retryableError')}
                        </Alert>
                    )}

                    {status === 'loading-more' && (
                        <div
                            className={styles.loadingMore}
                            role="status"
                        >
                            <CircularProgress size={20} />
                            <Typography>{t('trainingdata.openverse.loadingMore')}</Typography>
                        </div>
                    )}
                </div>

                {results.length > 0 && (
                    <div className={styles.resultsGrid}>
                        {results.map((result) => {
                            const isPending = pendingUseIds.has(result.id);
                            const hasFailed = failedUseIds.has(result.id);
                            const accessibleTitle = result.title || t('trainingdata.openverse.fallbackAlt');

                            return (
                                <button
                                    key={result.id}
                                    type="button"
                                    className={styles.resultButton}
                                    onClick={() => void handleUseImage(result)}
                                    disabled={isPending}
                                    aria-label={`${t('trainingdata.openverse.useImage')}: ${accessibleTitle}`}
                                >
                                    <img
                                        src={result.thumbnailUrl}
                                        alt={accessibleTitle}
                                        className={styles.resultImage}
                                    />
                                    <span className={styles.resultOverlay}>{t('trainingdata.openverse.useImage')}</span>
                                    {isPending && (
                                        <span
                                            className={styles.pendingUse}
                                            role="status"
                                        >
                                            {t('trainingdata.openverse.pendingUse')}
                                        </span>
                                    )}
                                    {hasFailed && (
                                        <span
                                            className={styles.failedUse}
                                            role="status"
                                        >
                                            {t('trainingdata.openverse.failedUse')}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {canLoadMore && (
                    <div className={styles.pagination}>
                        <Button
                            variant="outlined"
                            onClick={handleLoadMore}
                            disabled={isSearching}
                        >
                            {t('trainingdata.openverse.more')}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
