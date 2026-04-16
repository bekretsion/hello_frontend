import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import FixedLengthNumericInput from './fixed-length-numeric-input';

export function FixedLengthNumericDemo() {
  const [pin, setPin] = useState('');
  const [code, setCode] = useState('');
  const [year, setYear] = useState('');

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Fixed-Length Numeric Input Demo</CardTitle>
        <CardDescription>
          Try typing digits - leading zeros act as placeholders and are replaced from left to right.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="pin">4-Digit PIN</Label>
          <FixedLengthNumericInput
            id="pin"
            length={4}
            value={pin}
            onChange={setPin}
            aria-label="4-digit PIN"
          />
          <p className="text-sm text-muted-foreground">
            Current value: "{pin}"
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="code">6-Digit Code</Label>
          <FixedLengthNumericInput
            id="code"
            length={6}
            value={code}
            onChange={setCode}
            aria-label="6-digit verification code"
          />
          <p className="text-sm text-muted-foreground">
            Current value: "{code}"
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="year">4-Digit Year</Label>
          <FixedLengthNumericInput
            id="year"
            length={4}
            value={year}
            onChange={setYear}
            placeholder="YYYY"
            aria-label="4-digit year"
          />
          <p className="text-sm text-muted-foreground">
            Current value: "{year}"
          </p>
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>How it works:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Type digits to replace from left to right</li>
            <li>Backspace removes digits and shifts zeros from right</li>
            <li>Click to position cursor precisely</li>
            <li>Focus selects all for easy replacement</li>
            <li>Leading zeros maintain visual consistency</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
