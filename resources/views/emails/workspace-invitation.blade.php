<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Workspace Invitation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
        }
        .title {
            font-size: 20px;
            color: #1f2937;
            margin-bottom: 10px;
        }
        .message {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .button {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
        }
        .button:hover {
            background: #2563eb;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 14px;
            color: #6b7280;
        }
        .role-badge {
            background: #e0e7ff;
            color: #4338ca;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            text-transform: capitalize;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">CollabTool</div>
            <h1 class="title">You're Invited!</h1>
        </div>

        <p>Hi there,</p>
        
        <p>{{ $inviter->name }} has invited you to join the <strong>{{ $workspace->name }}</strong> workspace on CollabTool.</p>

        <div class="message">
            <p><strong>Role:</strong> <span class="role-badge">{{ $invitation->role }}</span></p>
            @if($workspace->description)
                <p><strong>Workspace:</strong> {{ $workspace->description }}</p>
            @endif
        </div>

        <p>Click the button below to accept this invitation and join the workspace:</p>

        <div style="text-align: center;">
            <a href="{{ $acceptUrl }}" class="button">Accept Invitation</a>
        </div>

        <p>If you don't have an account yet, you'll be able to create one when you click the link above.</p>

        <p>This invitation will expire in 7 days.</p>

        <div class="footer">
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            <p>© {{ date('Y') }} CollabTool. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
