<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules;
use Illuminate\Support\Facades\Log;

class ResetPasswordRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        Log::info('ResetPasswordRequest authorization check');
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        Log::info('ResetPasswordRequest validation rules applied');
        
        return [
            'token' => ['required', 'string'],
            'email' => ['required', 'string'], // Remove email validation to avoid infinite loop
            'password' => [
                'required', 
                'confirmed', 
                'min:8',
                'max:128',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/',
                Rules\Password::defaults()
            ],
        ];
    }

    /**
     * Get custom error messages for validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.required' => 'Email address is required.',
            'email.email' => 'Please enter a valid email address.',
            'email.string' => 'Email must be a string.',
            'password.required' => 'Password is required.',
            'password.confirmed' => 'The password confirmation does not match.',
            'password.min' => 'Password must be at least 8 characters long.',
            'password.max' => 'Password must not exceed 128 characters.',
            'password.regex' => 'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
            'token.required' => 'Reset token is required.',
            'token.string' => 'Reset token must be a string.',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        // Remove custom validation to prevent infinite loop
        // User existence will be checked in the controller
        Log::info('ResetPasswordRequest validation completed', [
            'fails' => $validator->fails(),
            'errors' => $validator->errors()->toArray()
        ]);
    }
}
