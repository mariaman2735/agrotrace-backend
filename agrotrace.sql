-- ============================================================
-- AgroTrace — Script de création de la base de données
-- Norme ISO 22005:2007
-- Base de données : agrotrace
-- ============================================================

CREATE DATABASE IF NOT EXISTS agrotrace
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE agrotrace;

-- ============================================================
-- ÉNUMÉRATIONS (via ENUM MySQL)
-- ============================================================

-- ============================================================
-- TABLE 1 : Utilisateur
-- ============================================================
CREATE TABLE IF NOT EXISTS Utilisateur (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    login            VARCHAR(100) NOT NULL UNIQUE,
    motDePasse       VARCHAR(255) NOT NULL,
    nom              VARCHAR(100) NOT NULL,
    role             ENUM('ADMINISTRATEUR', 'RESP_ACHAT', 'RESP_QUALITE',
                          'RESP_STOCK', 'RESP_COMMERCIAL', 'OPERATEUR_PRODUCTION',
                          'AUDITEUR') NOT NULL,
    dateCreation     DATETIME DEFAULT CURRENT_TIMESTAMP,
    actif            BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- ============================================================
-- TABLE 2 : Fournisseur
-- ============================================================
CREATE TABLE IF NOT EXISTS Fournisseur (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    nom              VARCHAR(150) NOT NULL,
    NINEA            VARCHAR(20)  NOT NULL UNIQUE,
    adresse          VARCHAR(255),
    telephone        VARCHAR(20),
    email            VARCHAR(100),
    dateEnregistrement DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- TABLE 3 : LotMatierePremiere
-- ============================================================
CREATE TABLE IF NOT EXISTS LotMatierePremiere (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    numLot             VARCHAR(50) NOT NULL UNIQUE,
    dateReception      DATE        NOT NULL,
    quantite           DOUBLE      NOT NULL,
    quantiteRestante   DOUBLE      NOT NULL,
    statut             ENUM('RECU', 'EN_ATTENTE', 'CONFORME',
                            'NON_CONFORME', 'BLOQUE', 'EPUISE') NOT NULL DEFAULT 'RECU',
    dateDC             DATE,
    fournisseur_id     INT NOT NULL,
    CONSTRAINT fk_lot_mp_fournisseur
        FOREIGN KEY (fournisseur_id) REFERENCES Fournisseur(id)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE 4 : OrdreFabrication
-- ============================================================
CREATE TABLE IF NOT EXISTS OrdreFabrication (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    numOrdreFabrication   VARCHAR(50) NOT NULL UNIQUE,
    dateCreation          DATE        NOT NULL,
    dateLancement         DATE,
    dateCloture           DATE,
    quantitePlanifiee     DOUBLE      NOT NULL,
    statut                ENUM('PLANIFIE', 'EN_COURS', 'SUSPENDU',
                               'TERMINE', 'ANNULE') NOT NULL DEFAULT 'PLANIFIE',
    operateur_id          INT,
    CONSTRAINT fk_of_operateur
        FOREIGN KEY (operateur_id) REFERENCES Utilisateur(id)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE 5 : ConsommationMatierePremiere
-- (Composition avec LotMatierePremiere)
-- ============================================================
CREATE TABLE IF NOT EXISTS ConsommationMatierePremiere (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    quantiteConsommee   DOUBLE NOT NULL,
    dateConsommation    DATE   NOT NULL,
    lotMP_id            INT    NOT NULL,
    ordreFabrication_id INT    NOT NULL,
    CONSTRAINT fk_consommation_lotmp
        FOREIGN KEY (lotMP_id) REFERENCES LotMatierePremiere(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_consommation_of
        FOREIGN KEY (ordreFabrication_id) REFERENCES OrdreFabrication(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABLE 6 : LotProduitFini
-- ============================================================
CREATE TABLE IF NOT EXISTS LotProduitFini (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    numLot               VARCHAR(50) NOT NULL UNIQUE,
    dateProduction       DATE        NOT NULL,
    quantiteProduite     DOUBLE      NOT NULL,
    quantiteDisponible   DOUBLE      NOT NULL,
    statut               ENUM('RECU', 'EN_ATTENTE', 'CONFORME',
                              'NON_CONFORME', 'BLOQUE', 'EPUISE') NOT NULL DEFAULT 'EN_ATTENTE',
    dateDC               DATE,
    ordreFabrication_id  INT NOT NULL,
    CONSTRAINT fk_lotpf_of
        FOREIGN KEY (ordreFabrication_id) REFERENCES OrdreFabrication(id)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE 7 : ControleQualite
-- (Agrégation avec LotProduitFini)
-- ============================================================
CREATE TABLE IF NOT EXISTS ControleQualite (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    dateControle    DATE         NOT NULL,
    typeControle    VARCHAR(100) NOT NULL,
    resultats       TEXT,
    statut          VARCHAR(50)  NOT NULL,
    lotPF_id        INT,
    responsable_id  INT,
    CONSTRAINT fk_cq_lotpf
        FOREIGN KEY (lotPF_id) REFERENCES LotProduitFini(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_cq_responsable
        FOREIGN KEY (responsable_id) REFERENCES Utilisateur(id)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE 8 : NonConformite
-- ============================================================
CREATE TABLE IF NOT EXISTS NonConformite (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    dateSignalement  DATE         NOT NULL,
    type             VARCHAR(100) NOT NULL,
    gravite          ENUM('CRITIQUE', 'MAJEURE', 'MINEURE') NOT NULL,
    description      TEXT,
    causePrincipale  TEXT,
    statut           ENUM('OUVERTE', 'EN_COURS',
                          'CLOTUREE', 'ARCHIVEE') NOT NULL DEFAULT 'OUVERTE',
    lotPF_id         INT,
    responsable_id   INT,
    CONSTRAINT fk_nc_lotpf
        FOREIGN KEY (lotPF_id) REFERENCES LotProduitFini(id),
    CONSTRAINT fk_nc_responsable
        FOREIGN KEY (responsable_id) REFERENCES Utilisateur(id)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE 9 : ActionCorrective
-- ============================================================
CREATE TABLE IF NOT EXISTS ActionCorrective (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    description      TEXT         NOT NULL,
    dateEcheance     DATE         NOT NULL,
    dateRealisation  DATE,
    responsable      VARCHAR(150),
    statut           VARCHAR(50)  NOT NULL DEFAULT 'PLANIFIEE',
    nonConformite_id INT          NOT NULL,
    CONSTRAINT fk_ac_nc
        FOREIGN KEY (nonConformite_id) REFERENCES NonConformite(id)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE 10 : RappelProduit
-- ============================================================
CREATE TABLE IF NOT EXISTS RappelProduit (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    dateRappel          DATE        NOT NULL,
    motif               TEXT        NOT NULL,
    statut              ENUM('INITIE', 'EN_COURS',
                             'CLOTURE', 'ARCHIVE') NOT NULL DEFAULT 'INITIE',
    actionCorrective_id INT,
    responsable_id      INT,
    CONSTRAINT fk_rappel_ac
        FOREIGN KEY (actionCorrective_id) REFERENCES ActionCorrective(id),
    CONSTRAINT fk_rappel_responsable
        FOREIGN KEY (responsable_id) REFERENCES Utilisateur(id)
) ENGINE=InnoDB;

-- Table de liaison RappelProduit <-> LotProduitFini
-- (remplace lotsImpliques : List<LotProduitFini>)
CREATE TABLE IF NOT EXISTS RappelProduit_LotPF (
    rappelProduit_id INT NOT NULL,
    lotPF_id         INT NOT NULL,
    PRIMARY KEY (rappelProduit_id, lotPF_id),
    CONSTRAINT fk_rappel_lot_rappel
        FOREIGN KEY (rappelProduit_id) REFERENCES RappelProduit(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_rappel_lot_lotpf
        FOREIGN KEY (lotPF_id) REFERENCES LotProduitFini(id)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE 11 : Client
-- ============================================================
CREATE TABLE IF NOT EXISTS Client (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    nom              VARCHAR(150) NOT NULL,
    NINEA            VARCHAR(20)  UNIQUE,
    adresse          VARCHAR(255),
    telephone        VARCHAR(20),
    email            VARCHAR(100)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE 12 : Vente
-- ============================================================
CREATE TABLE IF NOT EXISTS Vente (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    dateVente           DATE         NOT NULL,
    referenceCommande   VARCHAR(100) NOT NULL UNIQUE,
    quantiteVendue      DOUBLE       NOT NULL,
    prixUnitaire        DOUBLE       NOT NULL,
    lotPF_id            INT          NOT NULL,
    client_id           INT          NOT NULL,
    commercial_id       INT,
    CONSTRAINT fk_vente_lotpf
        FOREIGN KEY (lotPF_id) REFERENCES LotProduitFini(id),
    CONSTRAINT fk_vente_client
        FOREIGN KEY (client_id) REFERENCES Client(id),
    CONSTRAINT fk_vente_commercial
        FOREIGN KEY (commercial_id) REFERENCES Utilisateur(id)
) ENGINE=InnoDB;

-- ============================================================
-- DONNÉES DE TEST
-- ============================================================

-- Utilisateur admin par défaut
-- Mot de passe : admin123 (à hasher en production)
INSERT INTO Utilisateur (login, motDePasse, nom, role) VALUES
('admin', '$2b$10$examplehashedpassword', 'Administrateur', 'ADMINISTRATEUR'),
('resp_achat', '$2b$10$examplehashedpassword', 'Responsable Achat', 'RESP_ACHAT'),
('resp_qualite', '$2b$10$examplehashedpassword', 'Responsable Qualité', 'RESP_QUALITE');

-- Fournisseur de test
INSERT INTO Fournisseur (nom, NINEA, adresse, telephone, email) VALUES
('Agro Sénégal SARL', 'SN-001-2025', 'Dakar, Sénégal', '+221 77 000 00 00', 'contact@agro-senegal.sn');

SELECT 'Base de données AgroTrace créée avec succès !' AS message;
