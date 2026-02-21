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
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden border border-[#E2E8F0]">
                {/* Header */}
                <div className="bg-[#4F46E5] px-6 py-5 text-white">
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
                        <p className="text-sm text-[#64748B] mb-4">
                            This will create a new workspace where you can manage the project. The client will be added automatically.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#0F172A]">Workspace Name</Label>
                        <Input
                            value={data.workspace_name}
                            onChange={(e) => setData('workspace_name', e.target.value)}
                            placeholder="e.g. Website Redesign Project"
                            className="h-11 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A] focus:border-[#4F46E5] focus:ring-2 focus:ring-[rgba(79,70,229,0.1)]"
                            autoFocus
                        />
                        {errors.workspace_name && <p className="text-red-500 text-xs">{errors.workspace_name}</p>}
                    </div>

                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-[#0F172A] mb-2">What happens next:</h4>
                        <ul className="text-sm text-[#64748B] space-y-1.5">
                            <li className="flex items-start gap-2">
                                <span className="text-[#4F46E5] mt-0.5">•</span>
                                You become the workspace <strong className="text-[#0F172A]">Owner</strong>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#4F46E5] mt-0.5">•</span>
                                {clientName} joins as <strong className="text-[#0F172A]">Client</strong>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#4F46E5] mt-0.5">•</span>
                                This chat <strong className="text-[#0F172A]">remains active</strong> for continued communication
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#4F46E5] mt-0.5">•</span>
                                You can invite team members later
                            </li>
                        </ul>
                    </div>

                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11 rounded-xl border-[#E2E8F0] text-[#64748B]">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || !data.workspace_name.trim()}
                            className="flex-1 h-11 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-medium"
                        >
                            {processing ? 'Creating...' : 'Create Workspace'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
