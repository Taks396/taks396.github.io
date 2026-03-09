# Personal Website

Welcome to the GitHub page for my personal website.
I'd link it in this README, but you can just click on it to the right.
Anyway, this is the main repo for the content hosted on my site, so if you want the nitty gritty on how it's structured, continue reading and browse the files.

## Overall Structure
This site is currently hosted with GitHub Pages, so some features in this repo are specific to that functionality.
In general, the directories stored here should be self explanatory, but a brief explanation is provided for each:

- HTML Files: Stores the HTML content for each page on the website
- CSS Styles: Stores the CSS content which dictates how the website or specific elements look
- Scripts: Stores javascript files used to make certain dynamic features of this page possible
- index.html is the default html file that GitHub uses to host websites and serves as a redirect file with no other purpose

## Submodules

GitHub has the functionality to handle large files with a free extension called Git Large File Storage (Git LFS) and this functionality may be included in this repo.
I'm not actually sure about that because Git LFS is displayed in my codespace config, but I can't find it anywhere else. 
This matters because GitHub has a recommended repo size limit of 1GB and strongly enforces below 5GB.
Similarly there is a file size limit of 100MB.
A plain HTML website will never hit these limits, but if the site has a ton of images, it easily could.

Introducing submodules.
Since I don't want to include that LFS extension, I created a separate repo to house the images for the site and included the repo as a submodule.
Submodules act as pointers so they don't meaningfully increase the size of the main repo, and if that image repo gets too large, I can just make another one.

Why do I have this section in the README at all? Because setting this up SUCKED, so now if you want to do what I am doing for yourself, here's how.

### How to Setup Submodules

Before we begin, this has only been tested on GitHub Codespaces, though I know VsCode exists as a separate application.
I will update this if it's different when I get the chance to test it, but for the time being, assume your working environment is GitHub Codespaces:

1. Create a separate GitHub repo to store your files
    - This repo needs to be public for GitHub Pages to access it, but otherwise there is nothing special about it

1. Add some files to test that you're actually pulling down the repo as a submodule

1. Copy the HTTPS link for your repo under **Code > Local > HTTPS**

1. Open a terminal in your editor in the main repo and add the submodule 
    ```
    git submodule add <Copied HTTPS Link>
    ```
    This will create a `.gitmodules` file in your repo and initialize it
    - Codespaces do not initialize submodules automatically upon creation.
    To configure this, create the file `.devcontainer/devcontainer.json` and add the following:
        ```
        { "postCreateCommand": "git submodule update --init --recursive" }
        ```
        Otherwise, you will need to run this command every time you open a Codespace:
        ```
        git submodule init
        ```
If you want to be able to make changes to the submodule from your local environment continue, otherwise, you are done!

5. Go back to GitHub click on your profile in the top right, then **Settings > Developer Settings > Personal access tokens > Fine grained tokens**
    - We are creating a Personal Access Token (PAT) with read-write permissions for these repos because the default Codespace token doesn't have write permissions and will fail if you try to push changes to the submodule repo

5. Apply the following settings to your PAT:
    - Token Name
    - Resource Owner: \<username\>
    - Select Repositories:
        > Main Repo  
        > Submodule Repo
    - Repository Permissions > Contents > Read and write

5. Create your token and copy it somewhere secure as you cannot view it again

5. Back in your editor, move into the submodules directory and add some content
    ```
    cd <path/to/submodule>
    touch testfile.md
    ```

5. Save and commit your changes
    ```
    git add .
    git commit -m "Test file to push to submodule"
    ```

5. Push your changes to the submodule repo as sudo
    - I'm not sure why but normal `git push` never invoked the username and password prompts
    ```
    sudo git push
    ```

5. When prompted, type your GitHub username and copy your PAT as the password
    ```
    Username for 'https://github.com': <username>
    Password for 'https://Taks396@github.com': <PAT>
    ```
All future pushes from within the submodules directory will now use the PAT you generated as the credentials!
