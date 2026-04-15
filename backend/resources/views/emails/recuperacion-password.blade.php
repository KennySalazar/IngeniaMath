<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Segoe UI', sans-serif;
            background: #f4f4f8;
            margin: 0;
            padding: 0;
        }

        .container {
            max-width: 560px;
            margin: 40px auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .header {
            background: linear-gradient(135deg, #1a1a4e, #0d3b6e);
            padding: 2rem;
            text-align: center;
        }

        .logo-text {
            font-size: 28px;
            font-weight: 900;
            color: white;
            letter-spacing: -1px;
        }

        .logo-text span {
            color: #10b981;
        }

        .body {
            padding: 2rem;
        }

        .body h2 {
            font-size: 20px;
            color: #1a1a2e;
            margin-bottom: 0.5rem;
        }

        .body p {
            color: #555;
            font-size: 15px;
            line-height: 1.7;
        }

        .btn {
            display: block;
            width: fit-content;
            margin: 1.5rem auto;
            padding: 14px 32px;
            background: linear-gradient(135deg, #6366f1, #4f46e5);
            color: white !important;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 700;
            font-size: 15px;
        }

        .token-box {
            background: #f8f8ff;
            border: 1px dashed #6366f1;
            border-radius: 10px;
            padding: 12px 20px;
            text-align: center;
            font-family: monospace;
            font-size: 12px;
            color: #4f46e5;
            margin: 1rem 0;
            word-break: break-all;
        }

        .footer {
            padding: 1rem 2rem;
            background: #f8f8ff;
            text-align: center;
            font-size: 12px;
            color: #aaa;
        }

        .warning {
            background: #fff8e1;
            border-left: 4px solid #f59e0b;
            padding: 10px 14px;
            border-radius: 6px;
            font-size: 13px;
            color: #92400e;
            margin-top: 1rem;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <div class="logo-text">Ingenia<span>Math</span></div>
            <p style="color: rgba(255,255,255,0.6); font-size: 13px; margin-top: 6px;">Plataforma de aprendizaje adaptativo — USAC</p>
        </div>

        <div class="body">
            <h2>Hola, {{ $nombres }}</h2>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en IngeniaMath. Haz clic en el botón para crear una nueva contraseña:</p>

            <a href="http://192.168.0.8:5173/recuperar-password?token={{ $token }}" class="btn">
                Restablecer mi contraseña
            </a>

            <p style="text-align:center; color: #aaa; font-size: 12px; margin-bottom: 4px;">O copia este enlace en tu navegador:</p>
            <div class="token-box">http://192.168.0.8:5173/recuperar-password?token={{ $token }}</div>

            <div class="warning">
                <strong>Este enlace expira en 60 minutos.</strong> Si no solicitaste este cambio, ignora este mensaje. Tu contraseña no será modificada.
            </div>
        </div>

        <div class="footer">
            &copy; {{ date('Y') }} IngeniaMath &mdash; Universidad de San Carlos de Guatemala
        </div>
    </div>
</body>

</html>