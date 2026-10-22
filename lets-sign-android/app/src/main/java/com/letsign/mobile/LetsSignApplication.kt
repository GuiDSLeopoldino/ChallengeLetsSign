package com.letsign.mobile

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class LetsSignApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        com.letsign.mobile.data.local.TokenManager.init(this)
    }
}