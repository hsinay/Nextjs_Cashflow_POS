import { Badge } from '@/components/ui/badge';
import { authOptions } from '@/lib/auth';
import { getPaymentById } from '@/services/payment.service';
import {
    ArrowLeft,
    Banknote,
    Building2,
    Calendar,
    CheckCircle2,
    CreditCard,
    DollarSign,
    FileText,
    Hash,
    Smartphone as MobileWallet,
    Smartphone,
    User,
    Wallet2,
} from 'lucide-react';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const paymentMethodIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    CASH: Banknote,
    BANK_TRANSFER: Building2,
    CARD: CreditCard,
    UPI: Smartphone,
    CHEQUE: CheckCircle2,
    DIGITAL_WALLET: Wallet2,
    CREDIT: CreditCard,
    DEBIT: CreditCard,
    MOBILE_WALLET: MobileWallet,
};

const paymentMethodColors: Record<string, string> = {
    CASH: 'bg-green-100 text-green-800',
    BANK_TRANSFER: 'bg-blue-100 text-blue-800',
    CARD: 'bg-purple-100 text-purple-800',
    UPI: 'bg-orange-100 text-orange-800',
    CHEQUE: 'bg-gray-100 text-gray-800',
    DIGITAL_WALLET: 'bg-indigo-100 text-indigo-800',
    CREDIT: 'bg-purple-100 text-purple-800',
    DEBIT: 'bg-purple-100 text-purple-800',
    MOBILE_WALLET: 'bg-pink-100 text-pink-800',
};

const statusBadgeColors: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    FAILED: 'bg-red-100 text-red-800',
};

export default async function PaymentDetailsPage({ params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect('/login');
    }

    const payment = await getPaymentById(params.id);
    if (!payment) {
        return (
            <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Payment Not Found</h1>
                    <p className="mt-2 text-gray-600">The payment you're looking for doesn't exist.</p>
                    <Link
                        href="/dashboard/payments"
                        className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-900"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Payments
                    </Link>
                </div>
            </div>
        );
    }

    const formatCurrency = (amount: number) => {
        return formatCurrency(amount);
    };

    const formatDate = (date: Date) => {
        const d = new Date(date);
        return d.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const payerName = payment.customer?.name || payment.supplier?.name || 'Unknown';
    const payerEmail = payment.customer?.email || payment.supplier?.email || '-';
    const payerPhone = payment.customer?.contactNumber || payment.supplier?.contactNumber || '-';
    const Icon = paymentMethodIcons[payment.paymentMethod];
    const statusColor = statusBadgeColors[payment.status] || 'bg-gray-100 text-gray-800';

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <Link
                            href="/dashboard/payments"
                            className="mb-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-900"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Payments
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">Payment Details</h1>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Status Bar */}
                    <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Status</p>
                                <Badge className={`mt-1 ${statusColor}`}>
                                    {payment.status}
                                </Badge>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-600">Created</p>
                                <p className="mt-1 text-sm text-gray-900">{formatDate(payment.createdAt)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-8">
                        {/* Amount Section */}
                        <div className="mb-8 border-b border-gray-200 pb-8">
                            <div className="flex items-baseline gap-2">
                                <DollarSign className="h-6 w-6 text-gray-400" />
                                <span className="text-4xl font-bold text-gray-900">
                                    {formatCurrency(payment.amount)}
                                </span>
                            </div>
                            {payment.transactionFee > 0 && (
                                <div className="mt-4 space-y-2 text-sm">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Gross Amount:</span>
                                        <span>{formatCurrency(payment.amount + payment.transactionFee)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Transaction Fee:</span>
                                        <span className="text-red-600">-{formatCurrency(payment.transactionFee)}</span>
                                    </div>
                                    <div className="border-t border-gray-200 pt-2 flex justify-between font-medium text-gray-900">
                                        <span>Net Amount:</span>
                                        <span>{formatCurrency(payment.netAmount)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Payer Information */}
                        <div className="mb-8 border-b border-gray-200 pb-8">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                                <User className="h-5 w-5 text-gray-400" />
                                Payer Information
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Type</p>
                                    <Badge 
                                        variant="default"
                                        className={payment.payerType === 'CUSTOMER' ? 'bg-blue-100 text-blue-800 mt-1' : 'bg-amber-100 text-amber-800 mt-1'}
                                    >
                                        {payment.payerType}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Name</p>
                                    <p className="mt-1 text-gray-900">{payerName}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Email</p>
                                    <p className="mt-1 text-gray-900">{payerEmail}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Contact</p>
                                    <p className="mt-1 text-gray-900">{payerPhone}</p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="mb-8 border-b border-gray-200 pb-8">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                                <CreditCard className="h-5 w-5 text-gray-400" />
                                Payment Method
                            </h2>
                            <div className={`inline-flex items-center gap-3 rounded-lg px-4 py-3 ${paymentMethodColors[payment.paymentMethod]}`}>
                                {Icon && <Icon className="h-5 w-5" />}
                                <span className="font-medium">{payment.paymentMethod.replace('_', ' ')}</span>
                            </div>

                            {/* Card Details */}
                            {payment.cardLast4 && (
                                <div className="mt-4 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Card Brand:</span>
                                        <span className="text-gray-900">{payment.cardBrand || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Card Last 4:</span>
                                        <span className="text-gray-900">•••• {payment.cardLast4}</span>
                                    </div>
                                </div>
                            )}

                            {/* Bank Details */}
                            {payment.bankName && (
                                <div className="mt-4 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Bank Name:</span>
                                        <span className="text-gray-900">{payment.bankName}</span>
                                    </div>
                                    {payment.accountNumber && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Account Number:</span>
                                            <span className="text-gray-900">••••{payment.accountNumber.slice(-4)}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Cheque Details */}
                            {payment.chequeNumber && (
                                <div className="mt-4 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Cheque Number:</span>
                                        <span className="text-gray-900">{payment.chequeNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Cheque Date:</span>
                                        <span className="text-gray-900">
                                            {payment.chequeDate ? formatDate(payment.chequeDate) : '-'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Cheque Status:</span>
                                        <span className="text-gray-900">{payment.chequeStatus || '-'}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Payment Details */}
                        <div className="mb-8 border-b border-gray-200 pb-8">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                                <FileText className="h-5 w-5 text-gray-400" />
                                Payment Details
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Payment Date</p>
                                    <p className="mt-1 flex items-center gap-2 text-gray-900">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        {formatDate(payment.paymentDate)}
                                    </p>
                                </div>
                                {payment.referenceNumber && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Reference Number</p>
                                        <p className="mt-1 flex items-center gap-2 text-gray-900">
                                            <Hash className="h-4 w-4 text-gray-400" />
                                            {payment.referenceNumber}
                                        </p>
                                    </div>
                                )}
                                {payment.referenceOrderId && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Reference Order ID</p>
                                        <p className="mt-1 text-gray-900 font-mono text-sm">{payment.referenceOrderId}</p>
                                    </div>
                                )}
                                {payment.notes && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Notes</p>
                                        <p className="mt-1 text-gray-900">{payment.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Reconciliation */}
                        <div>
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">Reconciliation</h2>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Status</p>
                                    <Badge className={`mt-1 ${payment.isReconciled ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {payment.isReconciled ? 'Reconciled' : 'Not Reconciled'}
                                    </Badge>
                                </div>
                                {payment.reconciledAt && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Reconciled At</p>
                                        <p className="mt-1 text-gray-900">{formatDate(payment.reconciledAt)}</p>
                                    </div>
                                )}
                                {payment.reconciledBy && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Reconciled By</p>
                                        <p className="mt-1 text-gray-900">{payment.reconciledBy}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-8 flex gap-4">
                    <Link
                        href="/dashboard/payments"
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-6 py-2 font-medium text-gray-900 hover:bg-gray-300 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Payments
                    </Link>
                </div>
            </div>
        </div>
    );
}
