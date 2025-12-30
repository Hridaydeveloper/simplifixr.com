import { useMemo } from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface EmailValidatorProps {
  email: string;
}

export const EmailValidator = ({ email }: EmailValidatorProps) => {
  const validation = useMemo(() => {
    if (!email) return { status: 'empty', message: '' };
    
    // Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidFormat = emailRegex.test(email);
    
    if (!isValidFormat) {
      // Provide specific feedback
      if (!email.includes('@')) {
        return { status: 'invalid', message: 'Missing @ symbol' };
      }
      if (email.indexOf('@') === 0) {
        return { status: 'invalid', message: 'Missing username before @' };
      }
      if (email.indexOf('@') === email.length - 1) {
        return { status: 'invalid', message: 'Missing domain after @' };
      }
      if (!email.includes('.')) {
        return { status: 'invalid', message: 'Missing domain extension (e.g., .com)' };
      }
      if (email.endsWith('.')) {
        return { status: 'invalid', message: 'Invalid domain extension' };
      }
      return { status: 'invalid', message: 'Invalid email format' };
    }
    
    // Check for common typos
    const domain = email.split('@')[1]?.toLowerCase();
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
    const typoSuggestions: Record<string, string> = {
      'gmial.com': 'gmail.com',
      'gmal.com': 'gmail.com',
      'gamil.com': 'gmail.com',
      'gnail.com': 'gmail.com',
      'gmaill.com': 'gmail.com',
      'yaho.com': 'yahoo.com',
      'yahooo.com': 'yahoo.com',
      'hotmal.com': 'hotmail.com',
      'hotmial.com': 'hotmail.com',
      'outloo.com': 'outlook.com',
      'outlok.com': 'outlook.com',
    };
    
    if (domain && typoSuggestions[domain]) {
      return { 
        status: 'warning', 
        message: `Did you mean ${email.split('@')[0]}@${typoSuggestions[domain]}?` 
      };
    }
    
    return { status: 'valid', message: 'Valid email format' };
  }, [email]);

  if (validation.status === 'empty') return null;

  return (
    <div className={`flex items-center gap-2 text-xs mt-1 ${
      validation.status === 'valid' ? 'text-green-600' : 
      validation.status === 'warning' ? 'text-yellow-600' : 
      'text-red-500'
    }`}>
      {validation.status === 'valid' && <CheckCircle2 className="w-3 h-3" />}
      {validation.status === 'warning' && <AlertCircle className="w-3 h-3" />}
      {validation.status === 'invalid' && <XCircle className="w-3 h-3" />}
      <span>{validation.message}</span>
    </div>
  );
};
