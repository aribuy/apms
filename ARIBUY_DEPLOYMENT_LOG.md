# Aribuy Digital - WordPress Deployment Documentation

## Project Overview
**Business Concept**: Aribuy Digital is a digital marketplace selling Adobe Lightroom presets, ChatGPT prompts, Excel templates, plus web development services (WordPress/React/Java)

## Technical Stack
- **CMS**: WordPress with Astra theme
- **Page Builder**: Elementor + Ultimate Addons for Gutenberg (UAGB)
- **E-commerce**: WooCommerce + Easy Digital Downloads
- **Local Environment**: MAMP (PHP 8.2, MySQL 8.0)
- **Server**: cPanel hosting with SSH access

## Environment Details

### Local Development
- **URL**: http://localhost:8080
- **Path**: `/Users/endik/Projects/aribuy-staging/`
- **Database**: aribuy_staging
- **User**: aribuy_user / aribuy_pass

### Production Server
- **URL**: https://aribuy.net
- **SSH**: ariz1228@aribuy.net:2223
- **Path**: `/home/ariz1228/public_html/`
- **Database**: ariz1228_aribuy_new
- **User**: ariz1228_aribuy_new / aribuy2024
- **SSH Key**: ~/.ssh/id_rsa_aribuy

## Deployment History

### Initial Setup (October 2024)
1. **Local WordPress Installation**
   - Installed WordPress via Homebrew
   - Configured PHP 8.2 with 512M memory limit
   - Created database and wp-config.php

2. **Theme & Plugin Installation**
   - Astra theme with AI Website Builder
   - Essential plugins: Elementor, WooCommerce, EDD, Contact Form 7
   - Created sample digital products and service pages

3. **Server Deployment**
   - Exported database with URL replacement (localhost:8080 → https://aribuy.net)
   - Transferred files via SSH
   - Imported database and configured wp-config.php

### Content Synchronization (Latest)
4. **Homepage Content Sync**
   - **Issue**: Server homepage showed different content than local
   - **Solution**: Copied complete post content from local (ID: 296)
   - **Command**: `wp post update 296 --post_content="$(cat content.txt)"`
   - **Result**: Full homepage with all sections now matches local

5. **Theme Customization Sync**
   - **Issue**: Button colors and hover effects different
   - **Solution**: Copied theme_mods_astra settings
   - **Command**: `wp option update theme_mods_astra "$(cat settings.txt)"`
   - **Result**: Button styling now matches local

6. **Navigation Menu Sync**
   - **Issue**: Menu items missing (Home, About, Services, Blog, Contact)
   - **Solution**: Assigned Primary Menu to theme locations
   - **Commands**: 
     ```bash
     wp menu location assign 'Primary Menu' primary
     wp menu location assign 'Primary Menu' mobile_menu
     wp menu location assign 'Primary Menu' footer_menu
     ```
   - **Result**: Complete navigation menu now working

7. **Footer Sync**
   - **Issue**: Footer widgets and layout different
   - **Solution**: Copied widget settings and sidebar configurations
   - **Commands**:
     ```bash
     wp option update sidebars_widgets "$(cat widgets.txt)"
     wp option update widget_text "$(cat text_widgets.txt)"
     ```
   - **Result**: Footer now matches local design

## Current Status
✅ **Homepage**: Complete content sync with all sections
✅ **Navigation**: Primary menu with all 5 items (Home, About, Services, Blog, Contact)
✅ **Styling**: Button colors and hover effects matching
✅ **Footer**: Widgets and menu properly configured
✅ **Database**: All content and settings synchronized

## Key Commands Used

### Content Management
```bash
# Get post content
wp post get 296 --field=post_content

# Update post content
wp post update 296 --post_content="$(cat content.txt)"

# Update theme settings
wp option update theme_mods_astra "$(cat settings.txt)"
```

### Menu Management
```bash
# List menus
wp menu list

# Assign menu to location
wp menu location assign 'Primary Menu' primary
```

### File Transfer
```bash
# Copy files to server
scp -i ~/.ssh/id_rsa_aribuy -P 2223 file.txt ariz1228@aribuy.net:/home/ariz1228/

# SSH connection
ssh -i ~/.ssh/id_rsa_aribuy -p 2223 ariz1228@aribuy.net
```

## Website Structure
- **Homepage**: Hero section, statistics, about, services, CTA, testimonials, gallery
- **About**: Company information and team details
- **Services**: WordPress, React, Java development services
- **Blog**: Latest news and updates
- **Contact**: Contact form and company information
- **Digital Products**: Lightroom presets, ChatGPT prompts, Excel templates

## Next Steps
- Monitor website performance
- Add more digital products
- Implement SEO optimization
- Set up analytics tracking
- Configure backup system

---
*Last Updated: October 14, 2025*
*Status: Production Ready*