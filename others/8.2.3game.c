#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#define size 3
//井字棋游戏

int win(void);
void bot(void);
void player(void);
void next(int loop);
void show_chess();
int check(int a, int b);

int game[size][size] = {0}; // player -> 1 bot ->2

int main(int argc, char const *argv[])
{
    int player = 0;

    int v = 1;
    srand(time(NULL));
    int first = rand() % 2 + 0; // 先手 1 -> player 0 -> bot
    for (int loop = 0 ; 1 ;loop++)
    {
        if (v == 1)
        {
            next(first++);
        }

        if (win() == 1)
        {
            player = 1;
            break;
        }
        else if (win() == 2)
        {
            player = 2;
            break;
        }
        next(first++);  
    }
    
    if (player == 1)
    {
        printf("玩家赢了");
    }
    else if (player == 2)
    {
        printf("bot win");
    }
    
    return 0;
}


// 显示棋盘
void show_chess()
{
    for (int i = 0; i < size; i++)
    {
        for (int j = 0; j < size; j++)
        {
            printf("%d ", game[i][j]);
            if(j == 2) printf("\n");
        }
        
    }
    
}


// 判断赢家 返回1 -> player 2 -> bot
int win()
{
    for (int i = 0; i < size; i++)
    {
        int count_row[2] = {0}, count_line[2] = {0};
        for (int j = 0; j < size; j++)
        {
            if (game[i][j] == 1)
            {
                count_row[1]++;
            }
            if (game[i][j] == 2)
            {
                count_row[0]++;
            }
            if (game[j][i] == 1)
            {
                count_line[1]++;
            }
            if (game[j][i] == 2)
            {
                count_line[0]++;
            }
            
            if (count_line[1] == 3 || count_row[1] == 3)
            {
                return 1;
            }
            else if (count_line[0] == 3 || count_row[0] == 3)
            {
                return 2;
            }                       
        }      
    }
    
    int count0 = 0, count0_ = 0, count1 = 0, count1_ = 0;
    for (int i = 0, j = 0; i < size; i++, j++)
    {
        if (game[i][j] == 1)
        {
            count1++;
        }
        else if (game[i][j] == 2)
        {
            count0++;
        }               
    }

    for (int i = 0, j = 2; i < size; i++, j--)
    {
        if (game[i][j] == 1)
        {
            count1_++;
        }
        else if (game[i][j] == 2)
        {
            count0_++;
        }  
    }

    if (count1 == 3 || count1_ == 3)
    {
        return 1;
    }
    else if (count0 == 3 || count0_ == 3)
    {
        return 2;
    }
    return 0;
}


// 轮到谁下棋
// loop单数 -> player loop双数 -> bot
void next(int loop)
{
    if (loop % 2)
    {
        player();
    }
    else
    {
        bot();
    }    
}


// 玩家下棋
void player()
{
    int a,b;

    do
    {    
        printf("轮到你了,下哪一个(1~3 1~3)");
        scanf_s("%d %d", &a, &b);
        a--,b--;
        if (check(a,b))
        {
            game[a][b] = 1;
            break;
        }
        else
        {
            printf("这里不能下\n");
        }
        
        
    } while (1);
    show_chess();
}


// bot下棋
void bot()
{
    int a,b;
    printf("bot正在下棋...\n");
    do
    {
        a = rand() % 3 + 0, b = rand() % 3 + 0;
    } while (!check(a,b));
    game[a][b] = 2;
    show_chess();
}


// 检查该位置是否可以下棋
int check(int a, int b)
{
    if (game[a][b] != 0)
    {
        return 0;
    }
    else
    {
        return 1;
    }
    
}