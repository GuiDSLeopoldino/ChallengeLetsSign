import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import styles from './styles';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'signer@letssign.com',
      senha: 'Signer@123',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.email, data.senha);
      router.replace('/(tabs)');
    } catch (error: any) {
      const message = error.response?.data?.mensagem || 'Erro ao fazer login';
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
          <Text style={styles.title}>Entrar na sua conta</Text>
          <Text style={styles.subtitle}>Acesse seus documentos para assinar</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
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
          {errors.email && (
            <Text style={styles.errorText}>{errors.email.message}</Text>
          )}

          {/* Password */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputIconContainer}>
              <Ionicons name="lock-closed-outline" size={22} color="#999" />
            </View>
            <TextInput
              {...register('senha')}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              autoComplete="current-password"
              style={[styles.input, errors.senha && styles.inputError]}
              placeholderTextColor="#999"
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
          {errors.senha && (
            <Text style={styles.errorText}>{errors.senha.message}</Text>
          )}

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Entrar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Demo credentials */}
        <View style={styles.demoContainer}>
          <Text style={styles.demoTitle}>Credenciais de demonstração:</Text>
          <View style={styles.demoGrid}>
            <View style={styles.demoItem}>
              <Text style={styles.demoLabel}>Admin</Text>
              <Text style={styles.demoValue}>admin@letssign.com</Text>
              <Text style={styles.demoValue}>Admin@123</Text>
            </View>
            <View style={styles.demoItem}>
              <Text style={styles.demoLabel}>Signatário</Text>
              <Text style={styles.demoValue}>signer@letssign.com</Text>
              <Text style={styles.demoValue}>Signer@123</Text>
            </View>
          </View>
        </View>

        {/* Register link */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Não tem conta? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.registerLink}>Cadastre-se</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}