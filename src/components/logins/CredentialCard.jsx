import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const CredentialCard = ({ item, onEdit, onDelete }) => (
  <Card className="bg-gray-50 border hover:shadow-md transition-shadow">
    <CardHeader>
      <CardTitle className="flex justify-between items-center">
        {item.website_name}
        <div className="flex space-x-1">
          <Button size="icon" variant="ghost" onClick={() => onEdit(item)}><Edit className="w-4 h-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => onDelete(item.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
        </div>
      </CardTitle>
      <CardDescription>{item.username}</CardDescription>
    </CardHeader>
    <CardContent className="text-sm text-gray-600 space-y-2">
      {item.password && <p>Password: ••••••••</p>}
      {item.card_info && <p>Card: {item.card_info}</p>}
      {item.account_number && <p>Account #: {item.account_number}</p>}
      {item.notes && <p className="pt-2 border-t">Notes: {item.notes}</p>}
    </CardContent>
  </Card>
);