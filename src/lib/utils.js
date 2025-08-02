
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format as fnsFormat, parseISO, isValid } from 'date-fns';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

export function formatNumber(num, fractionDigits = 2) {
    if (num === null || num === undefined) return Number(0).toFixed(fractionDigits);
    const numValue = Number(num);
    if (isNaN(numValue)) return Number(0).toFixed(fractionDigits);
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    }).format(numValue);
}

export function toInputDate(dateString) {
    if (!dateString) return '';
    try {
        const date = parseISO(dateString);
        if (!isValid(date)) {
            // Handle cases where dateString might be in a different format or invalid
            const directDate = new Date(dateString);
            if(isValid(directDate)) return fnsFormat(directDate, 'yyyy-MM-dd');
            return '';
        }
        return fnsFormat(date, 'yyyy-MM-dd');
    } catch (e) {
        console.error("Error formatting date:", e);
        return '';
    }
}

export function toDisplayDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = parseISO(dateString);
        if (!isValid(date)) return 'Invalid Date';
        return fnsFormat(date, 'MM/dd/yyyy');
    } catch (e) {
        console.error("Error parsing display date:", e);
        return 'Invalid Date';
    }
}
