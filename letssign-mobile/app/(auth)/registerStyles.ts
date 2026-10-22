import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#EC4899',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    gap: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIconContainer: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  eyeButton: {
    padding: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: -12,
    marginBottom: 4,
    marginLeft: 4,
  },
  strengthContainer: {
    marginTop: -8,
    marginBottom: 4,
  },
  strengthBar: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthEmpty: {
    backgroundColor: '#E5E7EB',
  },
  strengthWeak: {
    backgroundColor: '#EF4444',
  },
  strengthMedium: {
    backgroundColor: '#F59E0B',
  },
  strengthStrong: {
    backgroundColor: '#22C55E',
  },
  strengthText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  termsContainer: {
    marginTop: 4,
  },
  termsText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: '#EC4899',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#EC4899',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  registerText: {
    fontSize: 15,
    color: '#6B7280',
  },
  registerLink: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EC4899',
  },
});