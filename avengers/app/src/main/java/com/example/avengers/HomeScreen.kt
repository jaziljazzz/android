package com.example.avengers
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.Card
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.paint
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController

data class Oscars(
    val img1:Int,
    val img2:Int,
    val name:String,
    val description:String
)


val OscarsDetails= listOf(
    Oscars(R.drawable.willsmith1,R.drawable.willsmith2,"Will Smith","Will Smith is an American actor, comedian, producer, rapper, and songwriter. He has enjoyed success in television, film, and music. In April 2007, Newsweek called him \"the most powerful actor in Hollywood\". Smith has been nominated for five Golden Globe Awards, two Academy Awards, and has won four Grammy Awards."),
    Oscars(R.drawable.anthonyhopkins1,R.drawable.anthonyhopkins2,"Anthony Hopkins","Sir Philip Anthony Hopkins CBE (born 31 December 1937) is a Welsh actor, director, and producer.[2] One of Britain's most recognisable and prolific actors, he is known for his performances on the screen and stage. Hopkins has received many accolades throughout his career, including two Academy Awards, three British Academy Film Awards, a British Academy Television Award, two Primetime Emmy Awards and a Laurence Olivier Award. He has also received an honorary Golden Globe Award and the BAFTA Fellowship for lifetime achievement from the British Academy of Film and Television Arts. In 1993, he was knighted by Queen Elizabeth II for his services to the arts, and in 2003, he received a star on the Hollywood Walk of Fame for his achievements in the motion picture industry."),
    Oscars(R.drawable.jaoquinphoenix1,R.drawable.jaoquinphoenix2,"Jaoquin Pheonix","Joaquin Rafael Phoenix is an American actor known for playing dark and unconventional characters in independent films. He has received various accolades, including an Academy Award, a British Academy Film Award, a Grammy Award, and two Golden Globe Awards."),
    Oscars(R.drawable.ramimalek1,R.drawable.ramimalek2,"Rami Malek","Rami Malek is an American actor. He won a Critics' Choice Award and the Primetime Emmy Award for Outstanding Lead Actor in a Drama Series for his lead role as Elliot Alderson in the USA Network television series Mr. Robot. He also received Golden Globe Award, Screen Actors Guild Award, and TCA Award nominations."),
    Oscars(R.drawable.garyoldman1,R.drawable.garyoldman2,"Gary Oldman","Gary Oldman is a talented English movie star and character actor, renowned for his expressive acting style. One of the most celebrated thespians of his generation, with a diverse career encompassing theatre, film and television.Gary Leonard Oldman was born on March 21, 1958 in New Cross, London, England, to Kathleen (Cheriton), a homemaker, and Leonard Bertram Oldman, a welder. He won a scholarship to Britain's Rose Bruford Drama College, in Sidcup, Kent, where he received a B.A. in theatre arts in 1979.")
)
@Composable
fun HomeScreen(navController: NavController){
    Column {
        TopBar()
        ListOfCards(OscarsDetails,navController)
    }
}

@Composable
fun TopBar(){
    Row(modifier = Modifier
        .background(Color.Cyan)
        .fillMaxWidth()
        .padding(10.dp), verticalAlignment = Alignment.CenterVertically){
        Image(painter = painterResource(id = R.drawable.logo) , contentDescription = "logo",
            modifier = Modifier.size(64.dp))
        Spacer(modifier = Modifier.width(12.dp))
        Text(text = "OSCAR WINNERS", fontWeight = FontWeight.Bold, fontSize = 28.sp, color = Color.Black, letterSpacing = 1.5.sp)
    }
}

@Composable
fun ListOfCards(avengersDetails:List<Oscars>,navController: NavController){
    LazyColumn(contentPadding = PaddingValues(10.dp), modifier = Modifier
        .background(Color.Gray)
        .fillMaxSize()
    ){
        items(avengersDetails){oscars->
            AvengerCard(image1 = oscars.img1, image2 = oscars.img2,
                name = oscars.name, desc = oscars.description,navController=navController)
            Spacer(modifier = Modifier.height(15.dp))
        }
    }
}

@Composable
fun AvengerCard(image1:Int,image2:Int,name:String,desc:String,navController:NavController){
    Card(modifier = Modifier .clickable {
        navController.navigate(route = "description_screen/"+name+"/"+desc+"/"+image2)
    }
        .clip(RoundedCornerShape(15.dp))

        , elevation = 10.dp) {
        Column(modifier = Modifier
            .paint(painter = painterResource(id = R.drawable.bg2), contentScale = ContentScale.Crop)
            .fillMaxWidth()
            .padding(10.dp)){
            Image(painter = painterResource(id = image1), contentDescription = name,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(300.dp), contentScale = ContentScale.Crop)
            Spacer(modifier = Modifier.height(10.dp))
            Text(text = name, fontWeight = FontWeight.Bold,color= Color.Cyan,fontSize=20.sp,
                modifier = Modifier
                    .background(Color.Gray)
                    .clip(
                        RoundedCornerShape(12.dp)
                    )
                    .fillMaxWidth()
                    .padding(5.dp), textAlign = TextAlign.Center)
        }
    }
}

@Preview(showSystemUi = true, showBackground = true)
@Composable
fun HomeScreenPreview(){
}
