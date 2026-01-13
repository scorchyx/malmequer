#!/bin/bash

# Deploy Helper Script
# Facilita o processo de deploy para diferentes ambientes

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}===================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if git is clean
check_git_status() {
    if [[ -n $(git status -s) ]]; then
        print_warning "Tens alterações não commitadas:"
        git status -s
        echo ""
        read -p "Continuar mesmo assim? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Deploy to staging
deploy_staging() {
    print_header "Deploy para STAGING"

    check_git_status

    # Update from development
    print_warning "A fazer merge de development para staging..."
    git checkout staging
    git pull origin staging
    git merge development

    # Push
    print_warning "A fazer push para staging..."
    git push origin staging

    print_success "Deploy para staging iniciado!"
    print_success "URL: https://malmequer-staging.vercel.app"

    # Open Vercel dashboard
    read -p "Abrir dashboard do Vercel? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        xdg-open "https://vercel.com/scorchyx/malmequer/deployments" 2>/dev/null || \
        open "https://vercel.com/scorchyx/malmequer/deployments" 2>/dev/null || \
        echo "Abre: https://vercel.com/scorchyx/malmequer/deployments"
    fi
}

# Deploy to production
deploy_production() {
    print_header "Deploy para PRODUÇÃO"

    print_warning "⚠️  ATENÇÃO: Estás prestes a fazer deploy para PRODUÇÃO!"
    echo ""

    # Checklist
    echo "Checklist pré-deploy:"
    echo "  [ ] Código testado em staging?"
    echo "  [ ] Sem bugs conhecidos críticos?"
    echo "  [ ] Database migrations aplicadas?"
    echo "  [ ] Backup da database feito?"
    echo "  [ ] Equipa avisada?"
    echo ""

    read -p "Continuar com deploy para PRODUÇÃO? (yes/no) " -r
    echo
    if [[ ! $REPLY == "yes" ]]; then
        print_error "Deploy cancelado"
        exit 1
    fi

    check_git_status

    # Update from staging
    print_warning "A fazer merge de staging para main..."
    git checkout main
    git pull origin main
    git merge staging

    # Push
    print_warning "A fazer push para main (PRODUÇÃO)..."
    git push origin main

    print_success "Deploy para PRODUÇÃO iniciado!"
    print_success "URL: https://malmequer.vercel.app (ou teu domínio)"

    # Open Vercel dashboard
    xdg-open "https://vercel.com/scorchyx/malmequer/deployments" 2>/dev/null || \
    open "https://vercel.com/scorchyx/malmequer/deployments" 2>/dev/null || \
    echo "Abre: https://vercel.com/scorchyx/malmequer/deployments"
}

# Rollback
rollback() {
    print_header "ROLLBACK"

    echo "Opções de rollback:"
    echo "  1) Vercel Dashboard (recomendado - instantâneo)"
    echo "  2) Git revert (criar novo commit)"
    echo "  3) Git reset (reverter para commit específico)"
    echo ""

    read -p "Escolhe opção (1-3): " -n 1 -r
    echo

    case $REPLY in
        1)
            print_success "Abre o Vercel Dashboard:"
            echo "1. Vai a Deployments"
            echo "2. Encontra o deployment anterior que funcionava"
            echo "3. Click nos 3 pontos → 'Promote to Production'"
            xdg-open "https://vercel.com/scorchyx/malmequer/deployments" 2>/dev/null || \
            open "https://vercel.com/scorchyx/malmequer/deployments" 2>/dev/null || \
            echo "https://vercel.com/scorchyx/malmequer/deployments"
            ;;
        2)
            git log --oneline -10
            echo ""
            read -p "Hash do commit para reverter: " commit_hash
            git revert $commit_hash
            git push origin main
            print_success "Revert criado e pushed!"
            ;;
        3)
            git log --oneline -10
            echo ""
            read -p "Hash do commit para voltar: " commit_hash
            print_warning "ATENÇÃO: Isto vai reescrever o histórico!"
            read -p "Continuar? (yes/no) " -r
            if [[ $REPLY == "yes" ]]; then
                git reset --hard $commit_hash
                git push --force origin main
                print_success "Reset feito!"
            fi
            ;;
        *)
            print_error "Opção inválida"
            exit 1
            ;;
    esac
}

# View logs
view_logs() {
    print_header "Logs do Vercel"

    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI não está instalado"
        echo "Instala com: pnpm add -g vercel"
        exit 1
    fi

    vercel logs --follow
}

# Run migrations
run_migrations() {
    print_header "Database Migrations"

    echo "Escolhe ambiente:"
    echo "  1) Development (local)"
    echo "  2) Staging"
    echo "  3) Production (⚠️  CUIDADO!)"
    echo ""

    read -p "Escolhe opção (1-3): " -n 1 -r
    echo

    case $REPLY in
        1)
            print_warning "A criar migration para development..."
            read -p "Nome da migration: " migration_name
            npx prisma migrate dev --name "$migration_name"
            print_success "Migration criada!"
            ;;
        2)
            print_warning "A aplicar migrations em STAGING..."
            print_warning "Certifica-te que DATABASE_URL está configurado para staging!"
            read -p "Continuar? (y/N) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                npx prisma migrate deploy
                print_success "Migrations aplicadas em staging!"
            fi
            ;;
        3)
            print_error "⚠️  PRODUÇÃO - FAZER BACKUP PRIMEIRO!"
            read -p "Já fizeste backup? (yes/no) " -r
            if [[ $REPLY == "yes" ]]; then
                print_warning "A aplicar migrations em PRODUÇÃO..."
                npx prisma migrate deploy
                print_success "Migrations aplicadas em produção!"
            else
                print_error "Faz backup primeiro!"
                echo "pg_dump \$DATABASE_URL > backup_\$(date +%Y%m%d_%H%M%S).sql"
                exit 1
            fi
            ;;
    esac
}

# Main menu
show_menu() {
    print_header "Deploy Helper - Malmequer E-commerce"

    echo "Escolhe uma opção:"
    echo "  1) Deploy para STAGING"
    echo "  2) Deploy para PRODUÇÃO"
    echo "  3) Rollback"
    echo "  4) Ver logs (Vercel)"
    echo "  5) Database migrations"
    echo "  6) Sair"
    echo ""

    read -p "Opção: " -n 1 -r
    echo

    case $REPLY in
        1) deploy_staging ;;
        2) deploy_production ;;
        3) rollback ;;
        4) view_logs ;;
        5) run_migrations ;;
        6) exit 0 ;;
        *)
            print_error "Opção inválida"
            exit 1
            ;;
    esac
}

# Run
show_menu
