<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\WorkspaceInvitation;

class WorkspaceInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $invitation;
    public $workspace;
    public $inviter;

    /**
     * Create a new message instance.
     */
    public function __construct(WorkspaceInvitation $invitation)
    {
        $this->invitation = $invitation;
        $this->workspace = $invitation->workspace;
        $this->inviter = $invitation->inviter;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address($this->inviter->email, $this->inviter->name),
            subject: "You're invited to join {$this->workspace->name}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.workspace-invitation',
            with: [
                'invitation' => $this->invitation,
                'workspace' => $this->workspace,
                'inviter' => $this->inviter,
                'acceptUrl' => route('invites.show', $this->invitation->token),
            ]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
