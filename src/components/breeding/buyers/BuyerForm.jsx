
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

const Section = ({ title, children }) => (
    <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-semibold text-lg">{title}</h3>
        {children}
    </div>
);

const FormRow = ({ children }) => <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
const FormField = ({ label, children }) => <div className="space-y-1"><Label>{label}</Label>{children}</div>;

export function BuyerForm({ editingBuyer, onSave, onCancel }) {
    const initialFormState = {
        name: '', customer_number: '', email: '', phone: '',
        street_address: '', city: '', state: '', zip_code: '',
        credit: '0', internal_notes: '',
        purchase_details: {
            puppy_name: '', microchip_number: '', purchase_date: '', litter_id: '',
            pickup_date: '', pickup_location: '', transport_method: '',
            deposit_amount: '', deposit_date: '', balance_paid: '', balance_paid_date: '',
            remaining_balance: '', payment_method: ''
        },
        legal_forms: {
            deposit_agreement: false, bill_of_sale: false, health_guarantee: false,
            portal_tos: false, financing_agreement: false
        },
        medical_summary: {
            deworming_date1: '', deworming_product1: '', deworming_date2: '', deworming_product2: '',
            dhpp_date: '', rabies_date: '', additional_vaccines: '', health_notes: '',
            vet_name: '', vet_visit_date: ''
        },
        follow_up_details: {
            first_check_in: '', vaccination_reminder: '', birthday_reminder: '', referral_status: ''
        }
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (editingBuyer) {
            setFormData({
                ...initialFormState,
                ...editingBuyer,
                purchase_details: { ...initialFormState.purchase_details, ...editingBuyer.purchase_details },
                legal_forms: { ...initialFormState.legal_forms, ...editingBuyer.legal_forms },
                medical_summary: { ...initialFormState.medical_summary, ...editingBuyer.medical_summary },
                follow_up_details: { ...initialFormState.follow_up_details, ...editingBuyer.follow_up_details },
                credit: editingBuyer.credit?.toString() || '0',
                customer_number: editingBuyer.customer_number?.toString() || ''
            });
        } else {
            setFormData(initialFormState);
        }
    }, [editingBuyer]);

    const handleChange = (section, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleRootChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto p-1">
            <Section title="Buyer Information">
                <FormRow>
                    <FormField label="Full Name *"><Input value={formData.name} onChange={e => handleRootChange('name', e.target.value)} required /></FormField>
                    <FormField label="Customer ID"><Input value={formData.customer_number} onChange={e => handleRootChange('customer_number', e.target.value)} type="number" /></FormField>
                </FormRow>
                <FormRow>
                    <FormField label="Email"><Input value={formData.email} onChange={e => handleRootChange('email', e.target.value)} type="email" /></FormField>
                    <FormField label="Phone"><Input value={formData.phone} onChange={e => handleRootChange('phone', e.target.value)} /></FormField>
                </FormRow>
                <FormRow>
                    <FormField label="Street Address"><Input value={formData.street_address} onChange={e => handleRootChange('street_address', e.target.value)} /></FormField>
                    <FormField label="City"><Input value={formData.city} onChange={e => handleRootChange('city', e.target.value)} /></FormField>
                </FormRow>
                <FormRow>
                    <FormField label="State"><Input value={formData.state} onChange={e => handleRootChange('state', e.target.value)} /></FormField>
                    <FormField label="Zip Code"><Input value={formData.zip_code} onChange={e => handleRootChange('zip_code', e.target.value)} /></FormField>
                </FormRow>
            </Section>

            <Section title="Purchase & Puppy Info">
                <FormRow>
                    <FormField label="Puppy Name"><Input value={formData.purchase_details.puppy_name} onChange={e => handleChange('purchase_details', 'puppy_name', e.target.value)} /></FormField>
                    <FormField label="Microchip Number"><Input value={formData.purchase_details.microchip_number} onChange={e => handleChange('purchase_details', 'microchip_number', e.target.value)} /></FormField>
                </FormRow>
                <FormRow>
                    <FormField label="Date of Purchase"><Input value={formData.purchase_details.purchase_date} onChange={e => handleChange('purchase_details', 'purchase_date', e.target.value)} type="date" /></FormField>
                    <FormField label="Litter Name/ID"><Input value={formData.purchase_details.litter_id} onChange={e => handleChange('purchase_details', 'litter_id', e.target.value)} /></FormField>
                </FormRow>
                <FormRow>
                    <FormField label="Pickup Date"><Input value={formData.purchase_details.pickup_date} onChange={e => handleChange('purchase_details', 'pickup_date', e.target.value)} type="date" /></FormField>
                    <FormField label="Pickup Location"><Input value={formData.purchase_details.pickup_location} onChange={e => handleChange('purchase_details', 'pickup_location', e.target.value)} /></FormField>
                </FormRow>
                <FormField label="Transportation Method"><Input value={formData.purchase_details.transport_method} onChange={e => handleChange('purchase_details', 'transport_method', e.target.value)} /></FormField>
            </Section>

            <Section title="Payment Details">
                <FormRow>
                    <FormField label="Deposit Amount"><Input value={formData.purchase_details.deposit_amount} onChange={e => handleChange('purchase_details', 'deposit_amount', e.target.value)} type="number" step="0.01" /></FormField>
                    <FormField label="Deposit Date"><Input value={formData.purchase_details.deposit_date} onChange={e => handleChange('purchase_details', 'deposit_date', e.target.value)} type="date" /></FormField>
                </FormRow>
                <FormRow>
                    <FormField label="Balance Paid"><Input value={formData.purchase_details.balance_paid} onChange={e => handleChange('purchase_details', 'balance_paid', e.target.value)} type="number" step="0.01" /></FormField>
                    <FormField label="Balance Paid Date"><Input value={formData.purchase_details.balance_paid_date} onChange={e => handleChange('purchase_details', 'balance_paid_date', e.target.value)} type="date" /></FormField>
                </FormRow>
                <FormRow>
                    <FormField label="Remaining Balance"><Input value={formData.purchase_details.remaining_balance} onChange={e => handleChange('purchase_details', 'remaining_balance', e.target.value)} type="number" step="0.01" /></FormField>
                    <FormField label="Credits/Discounts"><Input value={formData.credit} onChange={e => handleRootChange('credit', e.target.value)} type="number" step="0.01" /></FormField>
                </FormRow>
                <FormField label="Payment Method"><Input value={formData.purchase_details.payment_method} onChange={e => handleChange('purchase_details', 'payment_method', e.target.value)} /></FormField>
            </Section>

            <Section title="Legal & Forms">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2"><Checkbox id="deposit_agreement" checked={formData.legal_forms.deposit_agreement} onCheckedChange={c => handleChange('legal_forms', 'deposit_agreement', c)} /><Label htmlFor="deposit_agreement">Signed Deposit Agreement</Label></div>
                    <div className="flex items-center space-x-2"><Checkbox id="bill_of_sale" checked={formData.legal_forms.bill_of_sale} onCheckedChange={c => handleChange('legal_forms', 'bill_of_sale', c)} /><Label htmlFor="bill_of_sale">Signed Bill of Sale</Label></div>
                    <div className="flex items-center space-x-2"><Checkbox id="health_guarantee" checked={formData.legal_forms.health_guarantee} onCheckedChange={c => handleChange('legal_forms', 'health_guarantee', c)} /><Label htmlFor="health_guarantee">Health Guarantee</Label></div>
                    <div className="flex items-center space-x-2"><Checkbox id="portal_tos" checked={formData.legal_forms.portal_tos} onCheckedChange={c => handleChange('legal_forms', 'portal_tos', c)} /><Label htmlFor="portal_tos">Portal Terms of Service</Label></div>
                    <div className="flex items-center space-x-2"><Checkbox id="financing_agreement" checked={formData.legal_forms.financing_agreement} onCheckedChange={c => handleChange('legal_forms', 'financing_agreement', c)} /><Label htmlFor="financing_agreement">Financing Agreement</Label></div>
                </div>
            </Section>

            <Section title="Medical Summary">
                <FormRow>
                    <FormField label="Deworming Date 1"><Input value={formData.medical_summary.deworming_date1} onChange={e => handleChange('medical_summary', 'deworming_date1', e.target.value)} type="date" /></FormField>
                    <FormField label="Deworming Product 1"><Input value={formData.medical_summary.deworming_product1} onChange={e => handleChange('medical_summary', 'deworming_product1', e.target.value)} /></FormField>
                </FormRow>
                <FormRow>
                    <FormField label="Deworming Date 2"><Input value={formData.medical_summary.deworming_date2} onChange={e => handleChange('medical_summary', 'deworming_date2', e.target.value)} type="date" /></FormField>
                    <FormField label="Deworming Product 2"><Input value={formData.medical_summary.deworming_product2} onChange={e => handleChange('medical_summary', 'deworming_product2', e.target.value)} /></FormField>
                </FormRow>
                <FormRow>
                    <FormField label="DHPP Date"><Input value={formData.medical_summary.dhpp_date} onChange={e => handleChange('medical_summary', 'dhpp_date', e.target.value)} type="date" /></FormField>
                    <FormField label="Rabies Date"><Input value={formData.medical_summary.rabies_date} onChange={e => handleChange('medical_summary', 'rabies_date', e.target.value)} type="date" /></FormField>
                </FormRow>
                <FormField label="Additional Vaccines"><Input value={formData.medical_summary.additional_vaccines} onChange={e => handleChange('medical_summary', 'additional_vaccines', e.target.value)} /></FormField>
                <FormRow>
                    <FormField label="Vet Name"><Input value={formData.medical_summary.vet_name} onChange={e => handleChange('medical_summary', 'vet_name', e.target.value)} /></FormField>
                    <FormField label="Vet Visit Date"><Input value={formData.medical_summary.vet_visit_date} onChange={e => handleChange('medical_summary', 'vet_visit_date', e.target.value)} type="date" /></FormField>
                </FormRow>
                <FormField label="Known Health Issues/Notes"><Textarea value={formData.medical_summary.health_notes} onChange={e => handleChange('medical_summary', 'health_notes', e.target.value)} /></FormField>
            </Section>

            <Section title="Follow-Up Tracker">
                <FormRow>
                    <FormField label="First Check-in Date"><Input value={formData.follow_up_details.first_check_in} onChange={e => handleChange('follow_up_details', 'first_check_in', e.target.value)} type="date" /></FormField>
                    <FormField label="Vaccination Reminder Date"><Input value={formData.follow_up_details.vaccination_reminder} onChange={e => handleChange('follow_up_details', 'vaccination_reminder', e.target.value)} type="date" /></FormField>
                </FormRow>
                <FormRow>
                    <FormField label="Birthday Reminder"><Input value={formData.follow_up_details.birthday_reminder} onChange={e => handleChange('follow_up_details', 'birthday_reminder', e.target.value)} type="date" /></FormField>
                    <FormField label="Gift Certificate Referral Status"><Input value={formData.follow_up_details.referral_status} onChange={e => handleChange('follow_up_details', 'referral_status', e.target.value)} /></FormField>
                </FormRow>
            </Section>

            <Section title="Internal Notes">
                <FormField label="Admin-only comments or warnings">
                    <Textarea value={formData.internal_notes} onChange={e => handleRootChange('internal_notes', e.target.value)} />
                </FormField>
            </Section>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit">{editingBuyer ? 'Update' : 'Add'} Buyer</Button>
            </div>
        </form>
    );
}
