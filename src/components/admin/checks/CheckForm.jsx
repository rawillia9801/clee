
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

const numberToWords = (num) => {
  const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  
  if ((num = num.toString()).length > 9) return 'overflow';
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return ''; 
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str.trim();
};

export const CheckForm = ({ onSave, initialData, onCancel, nextCheckNumber, templates, defaultTemplateId }) => {
  const [formData, setFormData] = useState(initialData || {
    check_number: nextCheckNumber || '',
    check_date: format(new Date(), 'yyyy-MM-dd'),
    payee_name: '',
    payee_address_line1: '',
    payee_address_line2: '',
    amount: '',
    memo: '',
    template_id: defaultTemplateId,
  });
  const [amountInWords, setAmountInWords] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      if(initialData.amount) {
        const [dollars, cents] = parseFloat(initialData.amount).toFixed(2).split('.');
        const words = numberToWords(dollars);
        setAmountInWords(`${words.charAt(0).toUpperCase() + words.slice(1)} and ${cents}/100`);
      }
    } else {
      setFormData(prev => ({ ...prev, check_number: nextCheckNumber, template_id: defaultTemplateId }));
    }
  }, [initialData, nextCheckNumber, defaultTemplateId]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));

    if (id === 'amount') {
      if (value && !isNaN(value)) {
        const [dollars, cents] = parseFloat(value).toFixed(2).split('.');
        const words = numberToWords(dollars);
        setAmountInWords(`${words.charAt(0).toUpperCase() + words.slice(1)} and ${cents}/100`);
      } else {
        setAmountInWords('');
      }
    }
  };
  
  const handleTemplateChange = (value) => {
    setFormData(prev => ({ ...prev, template_id: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, amount_in_words: amountInWords });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2"><Label htmlFor="check_number">Check Number *</Label><Input id="check_number" type="number" value={formData.check_number} onChange={handleChange} required /></div>
        <div className="space-y-2"><Label htmlFor="check_date">Date *</Label><Input id="check_date" type="date" value={formData.check_date} onChange={handleChange} required /></div>
        <div className="space-y-2">
            <Label htmlFor="template_id">Template</Label>
            <Select onValueChange={handleTemplateChange} value={formData.template_id || ''}>
                <SelectTrigger id="template_id"><SelectValue placeholder="Select a template" /></SelectTrigger>
                <SelectContent>
                    {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>{template.template_name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>
      <div className="space-y-2"><Label htmlFor="payee_name">Pay to the Order of *</Label><Input id="payee_name" value={formData.payee_name} onChange={handleChange} required /></div>
      <div className="space-y-2"><Label htmlFor="payee_address_line1">Address Line 1</Label><Input id="payee_address_line1" value={formData.payee_address_line1 || ''} onChange={handleChange} /></div>
      <div className="space-y-2"><Label htmlFor="payee_address_line2">Address Line 2</Label><Input id="payee_address_line2" value={formData.payee_address_line2 || ''} onChange={handleChange} /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label htmlFor="amount">Amount *</Label><Input id="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} required /></div>
        <div className="space-y-2"><Label>Amount in Words</Label><Input value={amountInWords} readOnly className="bg-gray-100" /></div>
      </div>
      <div className="space-y-2"><Label htmlFor="memo">Memo</Label><Textarea id="memo" value={formData.memo} onChange={handleChange} /></div>
      <div className="flex justify-end space-x-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="submit">Save Check</Button>
      </div>
    </form>
  );
};
