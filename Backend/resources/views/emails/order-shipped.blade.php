<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your TrueHarbor Order has Shipped</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f4f6f8;
            margin: 0;
            padding: 24px;
            color: #1e293b;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
        }
        .header {
            background-color: #0f172a;
            color: #ffffff;
            padding: 32px 24px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 22px;
            letter-spacing: 0.1em;
            font-weight: 700;
        }
        .header p {
            margin: 8px 0 0;
            color: #94a3b8;
            font-size: 13px;
        }
        .content {
            padding: 32px 24px;
        }
        .status-badge {
            display: inline-block;
            background-color: #ecfdf5;
            color: #047857;
            padding: 6px 14px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 16px;
            border: 1px solid #a7f3d0;
        }
        .tracking-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .tracking-num {
            font-family: monospace;
            font-size: 16px;
            font-weight: bold;
            color: #0f172a;
            margin: 6px 0 14px;
            letter-spacing: 0.05em;
        }
        .btn-track {
            display: inline-block;
            background-color: #0284c7;
            color: #ffffff !important;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .items-table th, .items-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
            font-size: 13px;
        }
        .footer {
            background-color: #f8fafc;
            padding: 20px 24px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>TRUEHARBOR</h1>
            <p>MARITIME OUTFITTERS &amp; PROVISIONS</p>
        </div>

        <div class="content">
            <span class="status-badge">⚓ DISPATCHED &amp; IN TRANSIT</span>

            <h2 style="margin: 0 0 8px; font-size: 20px; color: #0f172a;">Your provisions have weighed anchor!</h2>
            <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0 0 20px;">
                Ahoy {{ $order->shipping_address['name'] ?? 'Mariner' }}, your Order <strong>#{{ $order->id }}</strong> has been carefully packed and handed over to our maritime logistics partner.
            </p>

            @if($order->tracking_number)
                <div class="tracking-card">
                    <div style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Carrier: {{ $order->carrier_label ?? 'Logistics Carrier' }}</div>
                    <div class="tracking-num">{{ $order->tracking_number }}</div>

                    @if($order->tracking_url)
                        <a href="{{ $order->tracking_url }}" target="_blank" class="btn-track">Track Package &rarr;</a>
                    @endif
                </div>
            @endif

            <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #0f172a; margin-top: 24px;">Items in this Cargo</h3>
            <table class="items-table">
                <thead>
                    <tr style="background-color: #f8fafc;">
                        <th>Provision</th>
                        <th style="text-align: center;">Qty</th>
                        <th style="text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($order->items as $item)
                        <tr>
                            <td>{{ $item->product_name }}</td>
                            <td style="text-align: center;">{{ $item->quantity }}</td>
                            <td style="text-align: right;">{{ $item->formatted_line_total }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>

            <div style="margin-top: 24px; padding: 16px; background-color: #f8fafc; border-radius: 8px; font-size: 13px;">
                <strong>Destination:</strong><br>
                {{ $order->shipping_address['line1'] ?? '' }}, {{ $order->shipping_address['city'] ?? '' }}, {{ $order->shipping_address['province'] ?? '' }} {{ $order->shipping_address['postal_code'] ?? '' }}
            </div>
        </div>

        <div class="footer">
            <p style="margin: 0;">&copy; {{ date('Y') }} TrueHarbor Outfitter. Coastal grade utility and gear.</p>
        </div>
    </div>
</body>
</html>
