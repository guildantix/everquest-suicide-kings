# EverQuest Suicide Kings

This program was built to help run a suicide kings list in EverQuest.

## Features

- You can have multiple suicide lists and run one or more at a time during a raid event.
- The app will watch for new raid dumps, and automatically add new members to the raid when they join, or select members for removal when they no longer appear in the raid dump.
  - The EQ raid dump can exclude players if they're zoning when you perform a raid output file.
  
## Get Started

To begin, start by uploading a guild output file into the Guild tab.
![image](https://user-images.githubusercontent.com/66176124/179417936-7890b549-5dac-4064-9df5-3aa9627c32cf.png)


Next, to create your first SK list, in the SK List tab, click on the green "New List" button.
![image](https://user-images.githubusercontent.com/66176124/179418009-33a31dc2-8348-4d15-abb2-9bc019932d9c.png)

From here, you can add guild members to the SK list.
![image](https://user-images.githubusercontent.com/66176124/179418065-72061ca5-c868-44f9-b7b6-51296850e7cb.png)

There are options at the top to make this process easier, selecting all mains or all alts.<br/>
After your members have been selected, you can initiate a random roll to place everyone randomly in the list, or you can enter the values manually.  (The highest roll will appear at the top of the list.)  If you are migrating an existing list, you can start with your bottom member of your existing list, and enter seeds counting up from there.<br/>
Once the seeds and selections are complete, click on the white "Create" button to create the list.

![image](https://user-images.githubusercontent.com/66176124/179418160-b7b41add-85a6-46fd-8060-5fc397c3162d.png)

## Raids and Loot

### Master Looters

**Before we begin running a raid**, we should setup who our looters are and select your character's log file.  You can do that in the "Settings" tab.  You'll need to enter your character's name in the "Your Character" input, and any other players that are able to call for loot "rolling" should be added to the "Master Looters" textbox.
![image](https://user-images.githubusercontent.com/66176124/179418377-562973eb-0410-459b-b1d1-44e1730f4933.png)

### Starting a Raid event

Now we can start a raid.  To begin, click on the "Start Raid" button.<br />
![image](https://user-images.githubusercontent.com/66176124/179418414-26fa1986-f4a8-4076-bfee-dd05de56e504.png)

Next, you'll need to select the lists you want to run during the raid.<br />
![image](https://user-images.githubusercontent.com/66176124/179418440-e8c80d7b-1be7-4c7b-a3ce-f77ae0533fef.png)

Once started, the raid will be empty.  To fill out the raid, you can upload a raid dump file.  Once the first raid file has been uploaded, any new raid dumps should be picked up automatically.<br />
![image](https://user-images.githubusercontent.com/66176124/179418474-4d0a3150-6105-47f8-99a6-e1602f840c00.png)

If there are raiders that are in the raid dump that haven't been added to an SK list, it will prompt you to add them.<br />
![image](https://user-images.githubusercontent.com/66176124/179418523-ac089609-712a-4b2d-947b-c5318054e1b6.png)

### Suiciding Loot

To start a suicide request, in /raidsay, enter:<br/>
`X: <Item Link>`

This will initiate the loot callout.  Anyone interested in the item can simple put an `x` in /raidsay to suicide on the item.

Anyone that is wanting to suicide on the item, will appear at the top of the list in a separate table that sorts the "bidders" by their relative suicide position.

Once looting has been ended, the master looter can click on the red "Suicide" button to assign the item to suicide the winner for the item.<br/>
![image](https://user-images.githubusercontent.com/66176124/179418723-6cf4a69b-4a9c-44b6-9d3d-941d80a95204.png)

*Note*: you can change the bidding symbol in settings.  By default, it's `x`

### Application

This application is written in ElectronJS and will keep local database files (stored in json format).
