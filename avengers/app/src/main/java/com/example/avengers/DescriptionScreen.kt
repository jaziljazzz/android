package com.example.avengers
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp


@Composable
fun DescriptionScreen(name:String,desc:String,image:String){
    DescriptionSection(name = name, image = image, Desc =desc)
}

@Composable
fun DescriptionSection(name:String,image:String,Desc:String){
    Box(modifier = Modifier){
        Image(painter = painterResource(id = image.toInt()),
            contentDescription = name,modifier= Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop)
        Text(text = name, fontWeight = FontWeight.ExtraBold,color= Color.Cyan, fontSize = 30.sp,
            modifier = Modifier.fillMaxWidth().padding(10.dp))
        Text(text = Desc, modifier = Modifier.padding(20.dp).align(Alignment.BottomCenter),
            fontWeight = FontWeight.Bold, fontSize = 18.sp,color= Color.White)
    }
}
