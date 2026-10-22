package com.letsign.mobile.data.local

import android.content.Context
import android.content.SharedPreferences
import androidx.datastore.preferences.core.mutations
import androidx.datastore.preferences.preferencesDataStore
import androidx.datastore.preferences.stringPreferencesKey
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.tasks.await
import com.google.common.util.concurrent.ListenableFuture

object TokenManager {
    private const val PREF_NAME = "lets_sign_tokens"
    private const val KEY_ACCESS_TOKEN = "access_token"
    private const val KEY_REFRESH_TOKEN = "refresh_token"
    private const val KEY_USER_DATA = "user_data"

    // SharedPreferences (simpler for now, can migrate to DataStore later)
    private lateinit var sharedPrefs: SharedPreferences

    fun init(context: Context) {
        sharedPrefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
    }

    fun saveTokens(accessToken: String, refreshToken: String? = null) {
        sharedPrefs.edit().apply {
            putString(KEY_ACCESS_TOKEN, accessToken)
            refreshToken?.let { putString(KEY_REFRESH_TOKEN, it) }
        }
    }

    fun getAccessToken(): String? = sharedPrefs.getString(KEY_ACCESS_TOKEN, null)

    fun getRefreshToken(): String? = sharedPrefs.getString(KEY_REFRESH_TOKEN, null)

    fun clearTokens() {
        sharedPrefs.edit().clear().apply()
    }

    fun saveUserData(userJson: String) {
        sharedPrefs.edit().putString(KEY_USER_DATA, userJson).apply()
    }

    fun getUserData(): String? = sharedPrefs.getString(KEY_USER_DATA, null)

    fun isAuthenticated(): Boolean = getAccessToken() != null
}