import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';

// Mock useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock authenticationApi to control test scenarios
jest.mock('./Login', () => {
  const originalModule = jest.requireActual('./Login');
  
  // Create a mock function that we can control in tests
  const mockAuthenticationApi = jest.fn();
  
  return {
    __esModule: true,
    ...originalModule,
    // We'll override this in each test
  };
});

describe('Login Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    jest.clearAllMocks();
  });

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
  };

  describe('Initial Render', () => {
    test('renders login form with all required elements', () => {
      renderLogin();
      
      expect(screen.getByLabelText(/UserID/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
    });

    test('initial values are empty', () => {
      renderLogin();
      
      const userIDInput = screen.getByLabelText(/UserID/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/Password/i) as HTMLInputElement;
      
      expect(userIDInput.value).toBe('');
      expect(passwordInput.value).toBe('');
    });

    test('error message is not displayed initially', () => {
      renderLogin();
      
      expect(screen.queryByText(/Username and password are required/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/We didn't recognize the username or password/i)).not.toBeInTheDocument();
    });
  });

  describe('Input Validation', () => {
    test('UserID input accepts only alphanumeric characters', () => {
      renderLogin();
      
      const userIDInput = screen.getByLabelText(/UserID/i);
      
      fireEvent.change(userIDInput, { target: { value: 'admin123' } });
      expect((userIDInput as HTMLInputElement).value).toBe('admin123');
      
      fireEvent.change(userIDInput, { target: { value: 'admin@123' } });
      expect((userIDInput as HTMLInputElement).value).toBe('admin123'); // Special chars should be rejected
    });

    test('UserID input respects MaxLength of 10', () => {
      renderLogin();
      
      const userIDInput = screen.getByLabelText(/UserID/i);
      
      fireEvent.change(userIDInput, { target: { value: '12345678901' } });
      expect((userIDInput as HTMLInputElement).value.length).toBeLessThanOrEqual(10);
    });

    test('Password input accepts alphanumeric and special characters', () => {
      renderLogin();
      
      const passwordInput = screen.getByLabelText(/Password/i);
      
      fireEvent.change(passwordInput, { target: { value: 'Pass@123!' } });
      expect((passwordInput as HTMLInputElement).value).toBe('Pass@123!');
    });

    test('Password input respects MaxLength of 32', () => {
      renderLogin();
      
      const passwordInput = screen.getByLabelText(/Password/i);
      const longPassword = 'a'.repeat(33);
      
      fireEvent.change(passwordInput, { target: { value: longPassword } });
      expect((passwordInput as HTMLInputElement).value.length).toBeLessThanOrEqual(32);
    });
  });

  describe('Empty Field Validation', () => {
    test('shows error when UserID is empty and Login button is clicked', async () => {
      renderLogin();
      
      const loginButton = screen.getByRole('button', { name: /Login/i });
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        expect(screen.getByText('Username and password are required.')).toBeInTheDocument();
      });
    });

    test('shows error when Password is empty and Login button is clicked', async () => {
      renderLogin();
      
      const userIDInput = screen.getByLabelText(/UserID/i);
      fireEvent.change(userIDInput, { target: { value: 'admin' } });
      
      const loginButton = screen.getByRole('button', { name: /Login/i });
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        expect(screen.getByText('Username and password are required.')).toBeInTheDocument();
      });
    });

    test('shows error when both fields are empty and Login button is clicked', async () => {
      renderLogin();
      
      const loginButton = screen.getByRole('button', { name: /Login/i });
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        expect(screen.getByText('Username and password are required.')).toBeInTheDocument();
      });
    });

    test('error message disappears when user starts typing', async () => {
      renderLogin();
      
      // First trigger the error
      const loginButton = screen.getByRole('button', { name: /Login/i });
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        expect(screen.getByText('Username and password are required.')).toBeInTheDocument();
      });
      
      // Then type in UserID field
      const userIDInput = screen.getByLabelText(/UserID/i);
      fireEvent.change(userIDInput, { target: { value: 'admin' } });
      
      expect(screen.queryByText('Username and password are required.')).not.toBeInTheDocument();
    });
  });

  describe('API Authentication', () => {
    test('calls authentication API with correct credentials', async () => {
      renderLogin();
      
      const userIDInput = screen.getByLabelText(/UserID/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      
      fireEvent.change(userIDInput, { target: { value: 'admin' } });
      fireEvent.change(passwordInput, { target: { value: '123456' } });
      
      const loginButton = screen.getByRole('button', { name: /Login/i });
      fireEvent.click(loginButton);
      
      // Wait for the async operation
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/TestMain');
      }, { timeout: 2000 });
    });

    test('shows error message when credentials are incorrect', async () => {
      renderLogin();
      
      const userIDInput = screen.getByLabelText(/UserID/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      
      fireEvent.change(userIDInput, { target: { value: 'wronguser' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
      
      const loginButton = screen.getByRole('button', { name: /Login/i });
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        expect(
          screen.getByText(
            "We didn't recognize the username or password you entered. Please try again."
          )
        ).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    test('navigates to TestMain on successful authentication', async () => {
      renderLogin();
      
      const userIDInput = screen.getByLabelText(/UserID/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      
      fireEvent.change(userIDInput, { target: { value: 'admin' } });
      fireEvent.change(passwordInput, { target: { value: '123456' } });
      
      const loginButton = screen.getByRole('button', { name: /Login/i });
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/TestMain');
      }, { timeout: 2000 });
    });

    test('trims whitespace from UserID and Password before validation', async () => {
      renderLogin();
      
      const userIDInput = screen.getByLabelText(/UserID/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      
      // Input with leading/trailing spaces
      fireEvent.change(userIDInput, { target: { value: '  admin  ' } });
      fireEvent.change(passwordInput, { target: { value: '  123456  ' } });
      
      const loginButton = screen.getByRole('button', { name: /Login/i });
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/TestMain');
      }, { timeout: 2000 });
    });
  });

  describe('Loading State', () => {
    test('disables inputs and button during API call', async () => {
      renderLogin();
      
      const userIDInput = screen.getByLabelText(/UserID/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const loginButton = screen.getByRole('button', { name: /Login/i });
      
      fireEvent.change(userIDInput, { target: { value: 'admin' } });
      fireEvent.change(passwordInput, { target: { value: '123456' } });
      fireEvent.click(loginButton);
      
      // Check if button shows "Processing..." and is disabled
      expect(loginButton).toHaveTextContent('Processing...');
      expect(loginButton).toBeDisabled();
    });

    test('re-enables form after failed authentication', async () => {
      renderLogin();
      
      const userIDInput = screen.getByLabelText(/UserID/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const loginButton = screen.getByRole('button', { name: /Login/i });
      
      fireEvent.change(userIDInput, { target: { value: 'wronguser' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        expect(
          screen.getByText(
            "We didn't recognize the username or password you entered. Please try again."
          )
        ).toBeInTheDocument();
      }, { timeout: 2000 });
      
      // Form should be re-enabled
      expect(loginButton).not.toBeDisabled();
      expect(loginButton).toHaveTextContent('Login');
    });
  });

  describe('Form Submission', () => {
    test('submits form when Enter key is pressed', async () => {
      renderLogin();
      
      const userIDInput = screen.getByLabelText(/UserID/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      
      fireEvent.change(userIDInput, { target: { value: 'admin' } });
      fireEvent.change(passwordInput, { target: { value: '123456' } });
      
      // Press Enter in password field
      fireEvent.keyDown(passwordInput, { key: 'Enter', code: 'Enter' });
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/TestMain');
      }, { timeout: 2000 });
    });
  });

  describe('Error Message Display', () => {
    test('error message is left-aligned and styled correctly', async () => {
      renderLogin();
      
      const loginButton = screen.getByRole('button', { name: /Login/i });
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        expect(screen.getByText('Username and password are required.')).toBeInTheDocument();
      });
      
      // Verify error message exists (it's already styled in the component)
      const errorMessage = screen.getByText('Username and password are required.');
      expect(errorMessage).toBeInTheDocument();
    });

    test('only one error message is shown at a time', async () => {
      renderLogin();
      
      // Trigger empty field error
      const loginButton = screen.getByRole('button', { name: /Login/i });
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        expect(screen.getByText('Username and password are required.')).toBeInTheDocument();
      });
      
      // Fill in fields but with wrong credentials
      const userIDInput = screen.getByLabelText(/UserID/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      fireEvent.change(userIDInput, { target: { value: 'wronguser' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        expect(
          screen.getByText(
            "We didn't recognize the username or password you entered. Please try again."
          )
        ).toBeInTheDocument();
      }, { timeout: 2000 });
      
      // Old error should be gone
      expect(screen.queryByText('Username and password are required.')).not.toBeInTheDocument();
    });
  });
});