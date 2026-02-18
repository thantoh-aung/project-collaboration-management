import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { X, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function StartProjectModal({ chatId, clientName, onClose }) {
    const { data, setData, post, processing, errors } = useForm({
        workspace_name: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('marketplace.chats.convert', chatId), {
            onSuccess: () => onClose?.(),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <Rocket className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Start Project</h3>
                                <p className="text-sm text-indigo-200">Create a workspace with {clientName}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <form onSubmit={submit} className="p-6 space-y-5">
                    <div>
                        <p className="text-sm text-gray-600 mb-4">
                            This will create a new workspace where you can manage the project. The client will be added automatically.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Workspace Name</Label>
                        <Input
                            value={data.workspace_name}
                            onChange={(e) => setData('workspace_name', e.target.value)}
                            placeholder="e.g. Website Redesign Project"
                            className="h-11 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            autoFocus
                        />
                        {errors.workspace_name && <p className="text-red-500 text-xs">{errors.workspace_name}</p>}
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-indigo-900 mb-2">What happens next:</h4>
                        <ul className="text-sm text-indigo-700 space-y-1.5">
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-400 mt-0.5">•</span>
                                You become the workspace <strong>Owner</strong>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-400 mt-0.5">•</span>
                                {clientName} joins as <strong>Client</strong>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-400 mt-0.5">•</span>
                                This chat <strong>remains active</strong> for continued communication
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-400 mt-0.5">•</span>
                                You can invite team members later
                            </li>
                        </ul>
                    </div>

                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11 rounded-xl">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || !data.workspace_name.trim()}
                            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/30"
                        >
                            {processing ? 'Creating...' : 'Create Workspace'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
