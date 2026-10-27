import paramiko
import time
import sys

HOST = '172.31.3.60'
USER = 'root'
PASSWORD = 'Pd4IPr7H8PBRDBgGPvrYi@'
REMOTE_PATH = '/root/dcpet'

print("=" * 60)
print(" [DCPET] INICIANDO DEPLOY AUTOMATIZADO NA VM DA DEFESA CIVIL")
print(f" Destino: {USER}@{HOST}:22")
print("=" * 60)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    print("\n[*] 1. Estabelecendo sessao SSH segura...")
    ssh.connect(HOST, username=USER, password=PASSWORD, allow_agent=False, look_for_keys=False, timeout=15)
    print("    [OK] Conectado com sucesso!")

    # 1. Clonar ou Atualizar Repositório
    print("\n[*] 2. Clonando / Atualizando repositorio no diretorio remoto...")
    cmd_git = f"""
    set -e
    if [ ! -d "{REMOTE_PATH}" ]; then
        echo "Clonando repositorio DCPET..."
        git clone https://github.com/NeudoMaia/dcpet.git {REMOTE_PATH}
    fi
    cd {REMOTE_PATH}
    echo "Atualizando branch main..."
    git fetch origin main
    git reset --hard origin/main
    """
    stdin, stdout, stderr = ssh.exec_command(cmd_git)
    print(stdout.read().decode())
    err = stderr.read().decode()
    if err and "fatal" in err.lower():
        print("Erro Git:", err)
        sys.exit(1)

    # 2. Executar deploy.sh para build e subida do container Docker
    print("\n[*] 3. Construindo e subindo container dcpet-app...")
    cmd_deploy = f"cd {REMOTE_PATH} && bash deploy.sh"
    stdin, stdout, stderr = ssh.exec_command(cmd_deploy)
    out_deploy = stdout.read().decode('utf-8', errors='replace')
    err_deploy = stderr.read().decode('utf-8', errors='replace')
    sys.stdout.buffer.write(out_deploy.encode('utf-8', errors='replace'))
    sys.stdout.buffer.write(err_deploy.encode('utf-8', errors='replace'))
    print()

    # 3. Validar se o container está rodando e respondendo na porta 3005
    print("\n[*] 4. Testando healthcheck do container dcpet-app...")
    stdin, stdout, stderr = ssh.exec_command("docker exec dcpet-app wget -qO- http://localhost:3005/health")
    health_out = stdout.read().decode('utf-8', errors='replace')
    print("    Healthcheck:", health_out.strip())

    # 4. Atualizar Nginx no rdc_frontend
    print("\n[*] 5. Configurando Nginx no rdc_frontend para a rota /dcpet/...")
    stdin, stdout, stderr = ssh.exec_command("docker exec rdc_frontend cat /etc/nginx/conf.d/default.conf")
    current_conf = stdout.read().decode()

    if "/dcpet/" not in current_conf:
        print("    Adicionando rotas /dcpet/ no Nginx...")
        snippet = """
    # 1.1 Rota do Frontend do DCPET
    location /dcpet/ {
        resolver 127.0.0.11 valid=30s;
        set $upstream_dcpet http://dcpet-app:3005/;
        proxy_pass $upstream_dcpet;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location = /dcpet {
        return 301 /dcpet/;
    }

    # Rota dedicada de API para o DCPET
    location /api/sensores {
        resolver 127.0.0.11 valid=30s;
        set $upstream_dcpet_sensores http://dcpet-app:3005;
        proxy_pass $upstream_dcpet_sensores;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
"""
        # Inserir antes de location /assets/ ou location /api/
        target_marker = "# 2. Carregamento inteligente de assets"
        if target_marker in current_conf:
            new_conf = current_conf.replace(target_marker, snippet + "\n    " + target_marker)
        else:
            # Inserir antes de location / {
            new_conf = current_conf.replace("location / {", snippet + "\n    location / {")

        # Salvar configuração no host e copiar para o container
        sftp = ssh.open_sftp()
        with sftp.file('/root/nginx-rdc-default.conf', 'w') as f:
            f.write(new_conf)
        sftp.close()

        ssh.exec_command("docker cp /root/nginx-rdc-default.conf rdc_frontend:/etc/nginx/conf.d/default.conf")
        time.sleep(1)
        stdin, stdout, stderr = ssh.exec_command("docker exec rdc_frontend nginx -t")
        t_out = stdout.read().decode() + stderr.read().decode()
        print("    Validacao sintaxe Nginx:", t_out)
        
        stdin, stdout, stderr = ssh.exec_command("docker exec rdc_frontend nginx -s reload")
        print("    Reload Nginx:", stdout.read().decode(), stderr.read().decode())
    else:
        print("    [INFO] Rota /dcpet/ ja configurada no Nginx. Recarregando Nginx...")
        ssh.exec_command("docker exec rdc_frontend nginx -s reload")

    # 5. Testar rota externa via Nginx na porta 80
    print("\n[*] 6. Validando acesso via porta 80 (/dcpet/)...")
    stdin, stdout, stderr = ssh.exec_command("curl -s -I http://localhost/dcpet/ | head -n 5")
    print(stdout.read().decode())

    print("=" * 60)
    print(" [OK] DEPLOY E ESPELHAMENTO DO DCPET CONCLUIDO COM SUCESSO!")
    print(" URL de Acesso: http://172.31.3.60/dcpet/")
    print("=" * 60)

finally:
    ssh.close()
