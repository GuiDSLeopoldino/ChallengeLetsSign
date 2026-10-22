import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import styles from './registerStyles';

const registerSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(150, 'Nome deve ter no máximo 150 caracteres'),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().optional().refine((val) => !val || val.length >= 10, 'Telefone inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmarSenha: z.string(),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: 'As senhas não coincidem',
  path: ['confirmarSenha'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const senha = watch('senha');

  const getPasswordStrength = (password: string) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return Math.min(strength, 4);
  };

  const passwordStrength = getPasswordStrength(senha);

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await registerUser({
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        senha: data.senha,
      });
      router.replace('/(tabs)');
    } catch (error: any) {
      const message = error.response?.data?.mensagem || 'Erro ao criar conta';
      Alert.alert('Erro', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="document-text-outline" size={40} color="#fff" />
          </View>
          <Text style={styles.logoText}>LetsSign</Text>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>Comece a assinar documentos agora</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Name */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputIconContainer}>
              <Ionicons name="person-outline" size={22} color="#999" />
            </View>
            <TextInput
              {...register('nome')}
              placeholder="Seu nome completo"
              autoCapitalize="words"
              autoComplete="name"
              style={[styles.input, errors.nome && styles.inputError]}
              placeholderTextColor="#999"
            />
          </View>
          {errors.nome && <Text style={styles.errorText}>{errors.nome.message}</Text>}

          {/* Email */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputIconContainer}>
              <Ionicons name="mail-outline" size={22} color="#999" />
            </View>
            <TextInput
              {...register('email')}
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={[styles.input, errors.email && styles.inputError]}
              placeholderTextColor="#999"
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

          {/* Phone */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputIconContainer}>
              <Ionicons name="call-outline" size={22} color="#999" />
            </View>
            <TextInput
              {...register('telefone')}
              placeholder="+55 11 99999-0000"
              keyboardType="phone-pad"
              autoComplete="tel"
              style={[styles.input, errors.telefone && styles.inputError]}
              placeholderTextColor="#999"
            />
          </View>
          {errors.telefone && <Text style={styles.errorText}>{errors.telefone.message}</Text>}

          {/* Password */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputIconContainer}>
              <Ionicons name="lock-closed-outline" size={22} color="#999" />
            </View>
            <TextInput
              {...register('senha')}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              style={[styles.input, errors.senha && styles.inputError]}
              placeholderTextColor="#999"
              onChangeText={(text) => register('senha').onChange({ target: { value: text } })}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color="#999"
              />
            </TouchableOpacity>
          </View>
          {errors.senha && <Text style={styles.errorText}>{errors.senha.message}</Text>}

          {/* Password Strength */}
          {senha && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBar}>
                {[1, 2, 3, 4].map((level) => (
                  <View
                    key={level}
                    style={[
                      styles.strengthSegment,
                      passwordStrength >= level
                        ? level <= 2
                          ? styles.strengthWeak
                          : level === 3
                          ? styles.strengthMedium
                          : styles.strengthStrong
                        : styles.strengthEmpty
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.strengthText}>
                {['Muito fraca', 'Fraca', 'Média', 'Forte', 'Muito forte'][passwordStrength]}
              </Text>
            </View>
          )}

          {/* Confirm Password */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputIconContainer}>
              <Ionicons name="lock-closed-outline" size={22} color="#999" />
            </View>
            <TextInput
              {...register('confirmarSenha')}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              style={[styles.input, errors.confirmarSenha && styles.inputError]}
              placeholderTextColor="#999"
            />
          </View>
          {errors.confirmarSenha && <Text style={styles.errorText}>{errors.confirmarSenha.message}</Text>}

          {/* Terms */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              Ao criar sua conta, você concorda com nossos{' '}
              <Text style={styles.termsLink}>Termos de Uso</Text>{' '}
              e{' '}
              <Text style={styles.termsLink}>Política de Privacidade</Text>
            </Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Criar conta</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Login link */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Já tem conta? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.registerLink}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}