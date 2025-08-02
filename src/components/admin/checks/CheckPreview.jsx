import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';

export const CheckPreview = ({ checkData, settings, onPrint, onClose }) => {
  if (!checkData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl bg-white">
        <CardHeader>
          <CardTitle>Print Preview</CardTitle>
          <CardDescription>Review the check before printing. This will mark the check as 'Printed'.</CardDescription>
        </CardHeader>
        <CardContent>
          <div id="printable-check" className="p-4 border rounded-lg font-serif text-sm bg-white text-black">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold">{settings?.business_name || 'Your Business Name'}</p>
                <p>{settings?.address_line1 || '123 Business Rd.'}</p>
                <p>{settings?.address_line2 || 'Business City, ST 12345'}</p>
                <p className="text-xs">{settings?.bank_name || 'Your Bank'}</p>
              </div>
              <div className="text-right">
                <p>Check No: <span className="font-mono">{checkData.check_number}</span></p>
                <p>Date: <span className="font-mono">{format(new Date(checkData.check_date.replace(/-/g, '/')), 'MM/dd/yyyy')}</span></p>
              </div>
            </div>
            <div className="flex mt-8">
              <div className="w-2/3 pr-4">
                <div className="flex items-baseline">
                  <span className="text-gray-500 mr-2">Pay to the order of:</span>
                  <p className="border-b border-black flex-grow pb-1">{checkData.payee_name}</p>
                </div>
                <div className="mt-4">
                  <p className="border-b border-black pb-1">{checkData.amount_in_words} Dollars</p>
                </div>
              </div>
              <div className="w-1/3 flex items-center">
                <span className="mr-2">$</span>
                <div className="border border-black p-2 w-full text-center font-mono">
                  {parseFloat(checkData.amount).toFixed(2)}
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-8 items-end">
              <div>
                <p className="text-gray-500">Memo:</p>
                <p className="border-b border-black min-w-[200px] pb-1">{checkData.memo}</p>
              </div>
              <div className="w-1/2 text-center">
                 <div className="border-b border-black pb-1 h-6"></div>
              </div>
            </div>
            <div className="mt-4 text-center font-mono text-xs">
              <span>C{settings?.account_number}C</span>
              <span className="mx-2">A{settings?.routing_number}A</span>
              <span>{checkData.check_number}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={onPrint}><Printer className="w-4 h-4 mr-2" />Print</Button>
        </CardFooter>
      </Card>
    </div>
  );
};