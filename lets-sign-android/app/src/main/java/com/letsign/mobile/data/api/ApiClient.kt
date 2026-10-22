package com.letsign.mobile.data.api

import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.letsign.mobile.BuildConfig
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {
    private const val BASE_URL = "http://10.0.2.2:3000/" // Use 10.0.2.2 for Android emulator to access localhost
    // For physical device, use your machine's IP: "http://192.168.x.x:3000/"

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BODY else HttpLoggingInterceptor.Level.NONE
    }

    private val authInterceptor = Interceptor { chain ->
        val original = chain.request()
        val token = TokenManager.getAccessToken()
        val requestBuilder = original.newBuilder()
            .header("Accept", "application/json")
            .header("Content-Type", "application/json")
        
        token?.let {
            requestBuilder.header("Authorization", "Bearer $it")
        }
        
        val request = requestBuilder.build()
        chain.proceed(request)
    }

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(loggingInterceptor)
        .addInterceptor(authInterceptor)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()

    private val gson = GsonBuilder()
        .setLenient()
        .setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
        .create()

    private val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create(gson))
        .build()

    val authApi: AuthApi = retrofit.create(AuthApi::class.java)
    val documentsApi: DocumentsApi = retrofit.create(DocumentsApi::class.java)
    val signersApi: SignersApi = retrofit.create(SignersApi::class.java)
}