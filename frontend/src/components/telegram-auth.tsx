"use client"

import { useState } from 'react';
import ky from 'ky';
import { Button } from '@/components/ui/button';
import { toast } from "sonner"
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

// Create a ky instance with the base URL for your backend
const api = ky.create({
    prefixUrl: 'http://localhost:3001/api/telegram',
});

export default function TelegramAuth() {
    const [step, setStep] = useState<'start' | 'verify'>('start');
    const [phone, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');

    const handleStartAuth = async () => {
        try {
            console.log("Start auth")
            // Send phone and password to start the authentication process
            const response = await api.post('start', {
                json: { phone, password },
                timeout: 100000,
            }).json();

            // Log response to check if the backend is responding as expected
            console.log('Backend response on start auth:', response);

            // Set step to 'verify' to show the OTP input
            setStep('verify');
            toast.success('Code sent to your phone.');
        } catch (error: any) {
            console.error('Error during start auth:', error);
            toast.error(`Error: ${error.response?.error || 'Failed to send code'}`);
        }
    };

    const handleVerifyAuth = async () => {
        try {
            console.log(phone)
            const response = await api.post('verify', {
                json: { phone, password, code },
            }).json();

            // Log the response to check if the backend is responding
            console.log('Backend response on verify auth:', response);

            toast.success('Login successful. Redirecting...');

            setStep("start")
            setPhoneNumber("")
            setPassword("")
        } catch (error: any) {
            console.error('Error during verify auth:', error);
            toast.error(`Error: ${error.response?.error || 'Failed to verify code'}`);
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            {step === 'start' ? (
                <div>
                    <Input
                        placeholder="Phone number (+123456789)"
                        value={phone}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="mb-4"
                    />
                    <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mb-4"
                    />
                    <Button onClick={handleStartAuth} disabled={!phone || !password} className='mt-4'>
                        Send Code
                    </Button>
                </div>
            ) : step === 'verify' ? (
                <div>
                    <label className="block mb-2 font-medium">Enter the OTP:</label>
                    <InputOTP value={code} onChange={setCode} maxLength={6}>
                        <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                        </InputOTPGroup>
                    </InputOTP>
                    <Button onClick={handleVerifyAuth} disabled={code.length !== 5}>
                        Verify Code
                    </Button>
                </div>
            ) : (
                <div>Unknown step</div>
            )}
        </div>
    );
}
