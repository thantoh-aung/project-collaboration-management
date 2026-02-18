import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AddGroupButton({ onAddGroup, canEdit = true }) {
    const [isAdding, setIsAdding] = useState(false);
    const [groupName, setGroupName] = useState('');

    const handleAddGroup = async () => {
        if (!groupName.trim()) return;
        
        try {
            await onAddGroup({ name: groupName.trim() });
            setGroupName('');
            setIsAdding(false);
        } catch (error) {
            console.error('Failed to add group:', error);
        }
    };

    if (!canEdit) {
        return null;
    }

    if (isAdding) {
        return (
            <Card className="w-full border-2 border-dashed border-gray-300 bg-gray-50">
                <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-3">
                        <Plus className="h-4 w-4 text-gray-500" />
                        <h3 className="font-semibold text-sm text-gray-700">New Group</h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setIsAdding(false);
                                setGroupName('');
                            }}
                            className="ml-auto h-6 w-6 p-0 hover:bg-gray-200"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                    
                    <Input
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleAddGroup();
                            } else if (e.key === 'Escape') {
                                setIsAdding(false);
                                setGroupName('');
                            }
                        }}
                        placeholder="Group name..."
                        className="mb-2"
                        autoFocus
                    />
                    
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={handleAddGroup}
                            className="text-xs"
                            disabled={!groupName.trim()}
                        >
                            Create
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setIsAdding(false);
                                setGroupName('');
                            }}
                            className="text-xs"
                        >
                            Cancel
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card 
            className="w-full border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-gray-400 hover:bg-gray-100 transition-colors"
            onClick={() => setIsAdding(true)}
        >
            <CardContent className="p-8 text-center">
                <Plus className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Add Group</p>
            </CardContent>
        </Card>
    );
}
