<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RecuperacionPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $nombres,
        public string $token
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Recuperación de contraseña — IngeniaMath');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.recuperacion-password');
    }
}
