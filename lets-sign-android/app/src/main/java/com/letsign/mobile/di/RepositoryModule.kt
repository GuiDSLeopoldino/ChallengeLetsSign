package com.letsign.mobile.di

import android.content.Context
import com.letsign.mobile.data.api.ApiClient
import com.letsign.mobile.data.api.ApiServices
import com.letsign.mobile.data.local.TokenManager
import com.letsign.mobile.data.repository.AuthRepositoryImpl
import com.letsign.mobile.data.repository.DocumentRepositoryImpl
import com.letsign.mobile.data.repository.ParticipantRepositoryImpl
import com.letsign.mobile.data.repository.SignatureFieldRepositoryImpl
import com.letsign.mobile.data.repository.SignerRepositoryImpl
import com.letsign.mobile.domain.repository.AuthRepository
import com.letsign.mobile.domain.repository.DocumentRepository
import com.letsign.mobile.domain.repository.ParticipantRepository
import com.letsign.mobile.domain.repository.SignatureFieldRepository
import com.letsign.mobile.domain.repository.SignerRepository
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object RepositoryModule {

    @Provides
    @Singleton
    fun provideApiServices(): ApiServices = ApiClient.authApi

    @Provides
    @Singleton
    fun provideDocumentsApi(): ApiServices = ApiClient.documentsApi

    @Provides
    @Singleton
    fun provideSignersApi(): ApiServices = ApiClient.signersApi

    @Provides
    @Singleton
    fun provideAuthRepository(
        authApi: ApiServices,
        tokenManager: TokenManager
    ): AuthRepository = AuthRepositoryImpl(authApi, tokenManager)

    @Provides
    @Singleton
    fun provideDocumentRepository(
        documentsApi: ApiServices
    ): DocumentRepository = DocumentRepositoryImpl(documentsApi)

    @Provides
    @Singleton
    fun provideParticipantRepository(
        documentsApi: ApiServices
    ): ParticipantRepository = ParticipantRepositoryImpl(documentsApi)

    @Provides
    @Singleton
    fun provideSignatureFieldRepository(
        documentsApi: ApiServices
    ): SignatureFieldRepository = SignatureFieldRepositoryImpl(documentsApi)

    @Provides
    @Singleton
    fun provideSignerRepository(
        signersApi: ApiServices
    ): SignerRepository = SignerRepositoryImpl(signersApi)

    @Provides
    @Singleton
    fun provideTokenManager(@Suppress("UNUSED_PARAMETER") context: Context): TokenManager = TokenManager
}