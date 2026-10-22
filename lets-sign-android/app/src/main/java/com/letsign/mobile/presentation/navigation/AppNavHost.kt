package com.letsign.mobile.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.letsign.mobile.presentation.ui.screens.auth.LoginScreen
import com.letsign.mobile.presentation.ui.screens.auth.RegisterScreen
import com.letsign.mobile.presentation.ui.screens.documents.DocumentDetailScreen
import com.letsign.mobile.presentation.ui.screens.documents.DocumentListScreen
import com.letsign.mobile.presentation.ui.screens.documents.NewDocumentWizardScreen
import com.letsign.mobile.presentation.ui.screens.documents.SignerDocumentListScreen
import com.letsign.mobile.presentation.ui.screens.signers.SignerListScreen
import com.letsign.mobile.presentation.viewmodel.AuthViewModel
import com.letsign.mobile.presentation.viewmodel.DocumentViewModel
import com.letsign.mobile.presentation.viewmodel.SignerViewModel

@Composable
fun AppNavHost() {
    val navController = rememberNavController()
    val authViewModel = hiltViewModel<AuthViewModel>()
    val documentViewModel = hiltViewModel<DocumentViewModel>()
    val signerViewModel = hiltViewModel<SignerViewModel>()

    val isAuthenticated = authViewModel.uiState.collectAsStateWithLifecycle().value.isAuthenticated

    NavHost(navController, startDestination = if (isAuthenticated) "documents" else "login") {
        composable("login") {
            LoginScreen(
                onNavigateToRegister = { navController.navigate("register") },
                onLoginSuccess = { navController.popBackStack("documents", inclusive = false) }
            )
        }
        composable("register") {
            RegisterScreen(
                onNavigateToLogin = { navController.navigate("login") },
                onRegisterSuccess = { navController.popBackStack("documents", inclusive = false) }
            )
        }
        composable("documents") {
            DocumentListScreen(
                onNavigateToNew = { navController.navigate("new_document") },
                onNavigateToDetail = { id -> navController.navigate("document/$id") }
            )
        }
        composable("document/$documentId",
            arguments = listOf(androidx.navigation.navArgument("documentId") { type = androidx.navigation.NavType.StringType })
        ) {
            val documentId = getString("documentId")!!
            DocumentDetailScreen(
                documentId = documentId,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToEdit = { navController.navigate("edit_document/$documentId") },
                onDownloadPdf = { id, tipo -> /* Handle PDF download */ }
            )
        }
        composable("new_document") {
            NewDocumentWizardScreen(onComplete = { navController.popBackStack("documents", inclusive = false) })
        }
        composable("edit_document/$documentId",
            arguments = listOf(androidx.navigation.navArgument("documentId") { type = androidx.navigation.NavType.StringType })
        ) {
            val documentId = getString("documentId")!!
            NewDocumentWizardScreen(documentId = documentId, onComplete = { navController.popBackStack("documents", inclusive = false) })
        }
        composable("signer_documents") {
            SignerDocumentListScreen(onNavigateToDetail = { id -> navController.navigate("document/$id") })
        }
        composable("signers") {
            SignerListScreen(onNavigateBack = { navController.popBackStack() })
        }
    }
}