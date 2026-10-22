package com.letsign.mobile.presentation.ui.components

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.util.AttributeSet
import android.util.Base64
import android.view.MotionEvent
import android.view.View
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.ViewFactory
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.io.ByteArrayOutputStream

class SignatureView(
    context: Context,
    attrs: AttributeSet? = null
) : View(context, attrs) {

    private val paint = Paint().apply {
        color = Color.BLACK
        isAntiAlias = true
        style = Paint.Style.STROKE
        strokeWidth = 4f
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
    }

    private val path = Path()
    private var lastX = 0f
    private var lastY = 0f
    private var isDrawing = false

    var onSignatureChanged: (() -> Unit)? = null

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        canvas.drawPath(path, paint)
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        val x = event.x
        val y = event.y

        when (event.action) {
            MotionEvent.ACTION_DOWN -> {
                path.moveTo(x, y)
                lastX = x
                lastY = y
                isDrawing = true
                invalidate()
                return true
            }
            MotionEvent.ACTION_MOVE -> {
                path.quadTo(lastX, lastY, (x + lastX) / 2, (y + lastY) / 2)
                lastX = x
                lastY = y
                invalidate()
                return true
            }
            MotionEvent.ACTION_UP -> {
                isDrawing = false
                onSignatureChanged?.invoke()
                return true
            }
        }
        return super.onTouchEvent(event)
    }

    fun clear() {
        path.reset()
        invalidate()
    }

    fun isEmpty(): Boolean = path.isEmpty()

    fun getSignatureBitmap(): Bitmap {
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(Color.WHITE)
        draw(canvas)
        return bitmap
    }

    fun getSignatureBase64(): String {
        val bitmap = getSignatureBitmap()
        val outputStream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
        return Base64.encodeToString(outputStream.toByteArray(), Base64.NO_WRAP)
    }
}

@Composable
fun SignatureCanvas(
    modifier: Modifier = Modifier,
    onSignatureChanged: (String) -> Unit,
    onClear: () -> Unit
) {
    val signatureView = remember {
        SignatureView(
            context = androidx.compose.ui.platform.LocalContext.current,
            attrs = null
        ).apply {
            layoutParams = android.view.ViewGroup.LayoutParams(
                android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                android.view.ViewGroup.LayoutParams.MATCH_PARENT
            )
        }
    }

    val signatureBase64 by remember { mutableStateOf("") }
    val isEmpty by remember { mutableStateOf(true) }

    androidx.compose.ui.viewinterop.AndroidView(
        factory = { signatureView },
        update = { view ->
            (view as SignatureView).onSignatureChanged = {
                val base64 = view.getSignatureBase64()
                signatureBase64 = base64
                isEmpty = view.isEmpty()
                onSignatureChanged(base64)
            }
        },
        modifier = modifier.fillMaxSize()
    )

    if (!isEmpty) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            androidx.compose.foundation.layout.Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .background(Color.White)
            ) {
                androidx.compose.ui.viewinterop.AndroidView(
                    factory = { SignatureView(androidx.compose.ui.platform.LocalContext.current).apply {
                        layoutParams = android.view.ViewGroup.LayoutParams(
                            android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                            android.view.ViewGroup.LayoutParams.MATCH_PARENT
                        )
                    } },
                    modifier = Modifier.fillMaxSize()
                )
            }
        }
    }
}

@Composable
fun SignaturePad(
    modifier: Modifier = Modifier,
    onSign: (String) -> Unit,
    onClear: () -> Unit
) {
    val signatureBase64 by remember { mutableStateOf("") }
    val isEmpty by remember { mutableStateOf(true) }

    Column(modifier = modifier.fillMaxSize()) {
        Text(
            text = "Desenhe sua assinatura abaixo",
            fontSize = 16.sp,
            color = Color(0xFF757575),
            modifier = Modifier.padding(16.dp)
        )

        Card(
            modifier = Modifier
                .fillMaxWidth()
                .height(300.dp)
                .padding(16.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.White)
            ) {
                SignatureView(
                    context = androidx.compose.ui.platform.LocalContext.current
                ).apply {
                    layoutParams = android.view.ViewGroup.LayoutParams(
                        android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                        android.view.ViewGroup.LayoutParams.MATCH_PARENT
                    )
                }
            }
        }

        androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(16.dp))

        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            horizontalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(12.dp)
        ) {
            Button(
                onClick = { onClear() },
                colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                    containerColor = Color(0xFFF5F5F5),
                    contentColor = Color(0xFF757575)
                ),
                modifier = Modifier.weight(1f)
            ) {
                Text("Limpar", fontWeight = androidx.compose.ui.text.font.FontWeight.Medium)
            }

            Button(
                onClick = {
                    if (!isEmpty) onSign(signatureBase64)
                },
                enabled = !isEmpty,
                modifier = Modifier.weight(1f)
            ) {
                Text("Assinar", fontWeight = androidx.compose.ui.text.font.FontWeight.Medium)
            }
        }
    }
}