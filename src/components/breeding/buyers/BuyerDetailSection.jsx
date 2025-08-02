
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { User, Dog, PiggyBank, FileText, HeartPulse, Calendar, MessageSquare, Save, Printer } from 'lucide-react';

const SectionCard = ({ title, icon, children }) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg">
                {React.cloneElement(icon, { className: "w-6 h-6 text-primary" })}
                {title}
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            {children}
        </CardContent>
    </Card>
);

const FormRow = ({ children }) => <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">{children}</div>;
const FormField = ({ label, children }) => <div className="space-y-1"><Label>{label}</Label>{children}</div>;

export function BuyerDetailSection({ buyer, onSave }) {
    const [formData, setFormData] = useState(buyer);

    useEffect(() => {
        if(buyer) {
            setFormData({
                ...buyer,
                purchase_details: buyer.purchase_details || {},
                legal_forms: buyer.legal_forms || {},
                medical_summary: buyer.medical_summary || {},
                follow_up_details: buyer.follow_up_details || {},
            });
        }
    }, [buyer]);

    const handleChange = (section, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleAddressChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleRootChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onSave(formData);
    };

    const handlePrintMedical = () => {
        const medical = formData.medical_summary || {};
        const printWindow = window.open('', '_blank');
        printWindow.document.write('<html><head><title>Medical Summary</title>');
        printWindow.document.write('<style>body{font-family:sans-serif} h1{color:#333} table{width:100%;border-collapse:collapse} th,td{border:1px solid #ddd;padding:8px;text-align:left}</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(`<h1>Medical Summary for ${formData.purchase_details?.puppy_name || 'Puppy'}</h1>`);
        printWindow.document.write(`<h2>Owner: ${formData.name}</h2>`);
        printWindow.document.write('<h3>Deworming</h3>');
        printWindow.document.write(`<table><tr><th>Date</th><th>Product</th></tr><tr><td>${medical.deworming_date1 || ''}</td><td>${medical.deworming_product1 || ''}</td></tr><tr><td>${medical.deworming_date2 || ''}</td><td>${medical.deworming_product2 || ''}</td></tr></table>`);
        printWindow.document.write('<h3>Vaccinations</h3>');
        printWindow.document.write(`<table><tr><th>Vaccine</th><th>Date</th></tr><tr><td>DHPP</td><td>${medical.dhpp_date || ''}</td></tr><tr><td>Rabies</td><td>${medical.rabies_date || ''}</td></tr><tr><td>Additional</td><td>${medical.additional_vaccines || ''}</td></tr></table>`);
        printWindow.document.write(`<h3>Vet Info</h3><p>Vet Name: ${medical.vet_name || ''}<br>Visit Date: ${medical.vet_visit_date || ''}</p>`);
        printWindow.document.write(`<h3>Health Notes</h3><p>${medical.health_notes || ''}</p>`);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    };

    if (!buyer) return null;

    return (
        <div className="space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto pr-4">
            <div className="flex justify-between items-center sticky top-0 bg-gray-50/80 backdrop-blur-sm py-2 z-10">
                <h2 className="text-2xl font-bold">Buyer: {buyer.name} (#{buyer.customer_number})</h2>
                <Button onClick={handleSave}><Save className="w-4 h-4 mr-2" /> Save Changes</Button>
            </div>

            <SectionCard title="Buyer Information" icon={<User />}>
                <FormRow>
                    <FormField label="Full Name"><Input value={formData.name || ''} onChange={e => handleRootChange('name', e.target.value)} /></FormField>
                    <FormField label="Customer ID"><Input value={formData.customer_number || ''} onChange={e => handleRootChange('customer_number', e.target.value)} type="number" /></FormField>
                </FormRow>
                <FormRow>
                    <FormField label="Email"><Input value={formData.email || ''} onChange={e => handleRootChange('email', e.target.value)} type="email" /></FormField>
                    <FormField label="Phone"><Input value={formData.phone || ''} onChange={e => handleRootChange('phone', e.target.value)} /></FormField>
                </FormRow>
                <FormRow>
                    <FormField label="Street Address"><Input value={formData.street_address || ''} onChange={e => handleAddressChange('street_address', e.target.value)} /></FormField>
                    <FormField label="City"><Input value={formData.city || ''} onChange={e => handleAddressChange('city', e.target.value)} /></FormField>
                </FormRow>
                <FormRow>
                    <FormField label="State"><Input value={formData.state || ''} onChange={e => handleAddressChange('state', e.target.value)} /></FormField>
                    <FormField label="Zip Code"><Input value={formData.zip_code || ''} onChange={e => handleAddressChange('zip_code', e.target.value)} /></FormField>
                </FormRow>
            </SectionCard>

            <SectionCard title="Purchase & Puppy Info" icon={<Dog />}>
                <FormRow>
                    <FormField label="Puppy Name"><Input value={formData.purchase_details?.puppy_name || ''} onChange={e => handleChange('purchase_details', 'puppy_name', e.target.value)} /></FormField>
                    <FormField label="Microchip Number"><Input value={formData.purchase_details?.microchip_number || ''} onChange={e => handleChange('purchase_details', 'microchip_number', e.target.value)} /></FormField>
                </FormRow>
                <FormRow>
                    <FormField label="Date of Purchase"><Input value={formData.purchase_details?.purchase_date || ''} onChange={e => handleChange('purchase_details', 'purchase_date', e.target.value)} type="date" /></FormField>
                    <FormField label="Litter Name/ID"><Input value={formData.purchase_details?.litter_id || ''} onChange={e => handleChange('purchase_details', 'litter_id', e.target.value)} /></FormField>
                </FormRow>
                <FormRow>
                    <FormField label="Pickup Date"><Input value={formData.purchase_details?.pickup_date || ''} onChange={e => handleChange('purchase_details', 'pickup_date', e.target.value)} type="date" /></FormField>
                    <FormField label="Pickup Location"><Input value={formData.purchase_details?.pickup_location || ''} onChange={e => handleChange('purchase_details', 'pickup_location', e.target.value)} /></FormField>
                </FormRow>
                <FormField label="Transportation Method"><Input value={formData.purchase_details?.transport_method || ''} onChange={e => handleChange('purchase_details', 'transport_method', e.target.value)} /></FormField>
            </SectionCard>

            <SectionCard title="Payment Details" icon={<PiggyBank />}>
                <FormRow>
                    <FormField label="Deposit Amount"><Input value={formData.purchase_details?.deposit_amount || ''} onChange={e => handleChange('purchase_details', 'deposit_amount', e.target.value)} type="number" step="0.01" /></FormField>
                    <FormField label="Deposit Date"><Input value={formData.purchase_details?.deposit_date || ''} onChange={e => handleChange('purchase_details', 'deposit_date', e.target.value)} type="date" /></FormField>
                </FormRow>
                <FormRow>
                    <FormField label="Balance Paid"><Input value={formData.purchase_details?.balance_paid || ''} onChange={e => handleChange('purchase_details', 'balance_paid', e.target.value)} type="number" step="0.01" /></FormField>
                    <FormField label="Balance Paid Date"><Input value={formData.purchase_details?.balance_paid_date || ''} onChange={e => handleChange('purchase_details', 'balance_paid_date', e.target.value)} type="date" /></FormField>
                </FormRow>
                <FormRow>
                    <FormField label="Remaining Balance"><Input value={formData.purchase_details?.remaining_balance || ''} onChange={e => handleChange('purchase_details', 'remaining_balance', e.target.value)} type="number" step="0.01" /></FormField>
                    <FormField label="Credits/Discounts"><Input value={formData.credit || ''} onChange={e => handleRootChange('credit', e.target.value)} type="number" step="0.01" /></FormField>
                </FormRow>
                <FormField label="Payment Method"><Input value={formData.purchase_details?.payment_method || ''} onChange={e => handleChange('purchase_details', 'payment_method', e.target.value)} /></FormField>
            </SectionCard>

            <SectionCard title="Legal & Forms" icon={<FileText />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2"><Checkbox id="deposit_agreement" checked={!!formData.legal_forms?.deposit_agreement} onCheckedChange={c => handleChange('legal_forms', 'deposit_agreement', c)} /><Label htmlFor="deposit_agreement">Signed Deposit Agreement</Label></div>
                    <div className="flex items-center space-x-2"><Checkbox id="bill_of_sale" checked={!!formData.legal_forms?.bill_of_sale} onCheckedChange={c => handleChange('legal_forms', 'bill_of_sale', c)} /><Label htmlFor="bill_of_sale">Signed Bill of Sale</Label></div>
                    <div className="flex items-center space-x-2"><Checkbox id="health_guarantee" checked={!!formData.legal_forms?.health_guarantee} onCheckedChange={c => handleChange('legal_forms', 'health_guarantee', c)} /><Label htmlFor="health_guarantee">Health Guarantee</Label></div>
                    <div className="flex items-center space-x-2"><Checkbox id="portal_tos" checked={!!formData.legal_forms?.portal_tos} onCheckedChange={c => handleChange('legal_forms', 'portal_tos', c)} /><Label htmlFor="portal_tos">Portal Terms of Service</Label></div>
                    <div className="flex items-center space-x-2"><Checkbox id="financing_agreement" checked={!!formData.legal_forms?.financing_agreement} onCheckedChange={c => handleChange('legal_forms', 'financing_agreement', c)} /><Label htmlFor="financing_agreement">Financing Agreement</Label></div>
                </div>
            </SectionCard>

            <SectionCard title="Medical Summary" icon={<HeartPulse />}>
                <div className="flex justify-end mb-4"><Button onClick={handlePrintMedical} variant="outline"><Printer className="w-4 h-4 mr-2" /> Print Summary</Button></div>
                <FormRow>
                    <FormField label="Deworming Date 1"><Input value={formData.medical_summary?.deworming_date1 || ''} onChange={e => handleChange('medical_summary', 'deworming_date1', e.target.value)} type="date" /></FormField>
                    <FormField label="Deworming Product 1"><Input value={formData.medical_summary?.deworming_product1 || ''} onChange={e => handleChange('medical_summary', 'deworming_product1', e.target.value)} /></FormField>
                </FormRow>
                <FormRow>
                    <FormField label="Deworming Date 2"><Input value={formData.medical_summary?.deworming_date2 || ''} onChange={e => handleChange('medical_summary', 'deworming_date2', e.target.value)} type="date" /></FormField>
                    <FormField label="Deworming Product 2"><Input value={formData.medical_summary?.deworming_product2 || ''} onChange={e => handleChange('medical_summary', 'deworming_product2', e.target.value)} /></FormField>
                </FormRow>
                <FormRow>
                    <FormField label="DHPP Date"><Input value={formData.medical_summary?.dhpp_date || ''} onChange={e => handleChange('medical_summary', 'dhpp_date', e.target.value)} type="date" /></FormField>
                    <FormField label="Rabies Date"><Input value={formData.medical_summary?.rabies_date || ''} onChange={e => handleChange('medical_summary', 'rabies_date', e.target.value)} type="date" /></FormField>
                </FormRow>
                <FormField label="Additional Vaccines"><Input value={formData.medical_summary?.additional_vaccines || ''} onChange={e => handleChange('medical_summary', 'additional_vaccines', e.target.value)} /></FormField>
                <FormRow>
                    <FormField label="Vet Name"><Input value={formData.medical_summary?.vet_name || ''} onChange={e => handleChange('medical_summary', 'vet_name', e.target.value)} /></FormField>
                    <FormField label="Vet Visit Date"><Input value={formData.medical_summary?.vet_visit_date || ''} onChange={e => handleChange('medical_summary', 'vet_visit_date', e.target.value)} type="date" /></FormField>
                </FormRow>
                <FormField label="Known Health Issues/Notes"><Textarea value={formData.medical_summary?.health_notes || ''} onChange={e => handleChange('medical_summary', 'health_notes', e.target.value)} /></FormField>
            </SectionCard>

            <SectionCard title="Follow-Up Tracker" icon={<Calendar />}>
                <FormRow>
                    <FormField label="First Check-in Date"><Input value={formData.follow_up_details?.first_check_in || ''} onChange={e => handleChange('follow_up_details', 'first_check_in', e.target.value)} type="date" /></FormField>
                    <FormField label="Vaccination Reminder Date"><Input value={formData.follow_up_details?.vaccination_reminder || ''} onChange={e => handleChange('follow_up_details', 'vaccination_reminder', e.target.value)} type="date" /></FormField>
                </FormRow>
                <FormRow>
                    <FormField label="Birthday Reminder"><Input value={formData.follow_up_details?.birthday_reminder || ''} onChange={e => handleChange('follow_up_details', 'birthday_reminder', e.target.value)} type="date" /></FormField>
                    <FormField label="Gift Certificate Referral Status"><Input value={formData.follow_up_details?.referral_status || ''} onChange={e => handleChange('follow_up_details', 'referral_status', e.target.value)} /></FormField>
                </FormRow>
            </SectionCard>

            <SectionCard title="Internal Notes" icon={<MessageSquare />}>
                <FormField label="Admin-only comments or warnings">
                    <Textarea value={formData.internal_notes || ''} onChange={e => handleRootChange('internal_notes', e.target.value)} />
                </FormField>
            </SectionCard>
        </div>
    );
}
