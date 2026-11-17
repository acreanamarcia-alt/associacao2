import { CSSProperties, forwardRef } from 'react';
import { AssistedPersonRecord } from '../data/assistedPeopleStore';
import {
  AccountingEntry,
  DonationProductItem,
  DonationRecord,
  MonthlyDonorRecord,
  PickupScheduleRecord,
} from '../data/donationsStore';
import {
  INSTITUTION_PROFILE,
  OFFICIAL_ASSETS,
  VOLUNTEER_ROLES,
} from '../data/institutionalData';
import { VisitorStats } from '../data/visitorStore';
import { VolunteerApplication } from '../data/volunteersStore';
import { DashboardPdfCategories } from '../utils/dashboardPdfReport';

export interface DashboardReportPrintableProps {
  donations: DonationRecord[];
  accountingEntries: AccountingEntry[];
  monthlyDonors: MonthlyDonorRecord[];
  products: DonationProductItem[];
  pickups: PickupScheduleRecord[];
  volunteerApplications: VolunteerApplication[];
  assistedPeople: AssistedPersonRecord[];
  visitorStats: VisitorStats;
  categories: DashboardPdfCategories;
}

function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '11px',
  color: '#1C1917',
  backgroundColor: '#FFFFFF',
};

const thStyle: CSSProperties = {
  backgroundColor: '#14532D',
  color: '#FFFFFF',
  fontWeight: 700,
  textAlign: 'left',
  padding: '7px 8px',
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  borderBottom: '1px solid #14532D',
};

const tdStyle: CSSProperties = {
  padding: '6px 8px',
  borderBottom: '1px solid #E2E8F0',
  verticalAlign: 'top',
  color: '#1E293B',
};

export const DashboardReportPrintable = forwardRef<
  HTMLDivElement,
  DashboardReportPrintableProps
>(function DashboardReportPrintable(
  {
    donations,
    accountingEntries,
    monthlyDonors,
    products,
    pickups,
    volunteerApplications,
    assistedPeople,
    visitorStats,
    categories,
  },
  ref
) {
  const generatedAt = new Date().toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const totalEntradas = accountingEntries
    .filter((a) => a.kind === 'Entrada')
    .reduce((acc, a) => acc + a.amountBRL, 0);
  const totalSaidas = accountingEntries
    .filter((a) => a.kind === 'Saída')
    .reduce((acc, a) => acc + a.amountBRL, 0);
  const netBalance = totalEntradas - totalSaidas;
  const mrr = monthlyDonors
    .filter((m) => m.status !== 'Pausado')
    .reduce((acc, m) => acc + m.monthlyAmountBRL, 0);
  const totalFoodUnits = products.reduce((sum, p) => sum + p.receivedQty, 0);
  const completedPickups = pickups.filter((p) => p.status === 'Coletada').length;
  const activeAssisted = assistedPeople.filter((p) => p.status === 'Ativa').length;

  let sectionIndex = 1;

  return (
    <div
      ref={ref}
      style={{
        width: '794px',
        backgroundColor: '#FFFFFF',
        color: '#0F172A',
        fontFamily: '"Plus Jakarta Sans", Arial, sans-serif',
        boxShadow: 'none',
      }}
    >
      {/* Official Green Banner */}
      <div
        style={{
          backgroundColor: '#14532D',
          color: '#FFFFFF',
          padding: '22px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img
            src={OFFICIAL_ASSETS.logo}
            alt="Logo Projeto Sopão"
            crossOrigin="anonymous"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '9999px',
              objectFit: 'cover',
              border: '2px solid #FFFFFF',
              backgroundColor: '#FFFFFF',
              flexShrink: 0,
            }}
          />
          <div>
            <p
              style={{
                margin: 0,
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#DCFCE7',
              }}
            >
              Relatório Gerencial Oficial · Painel Administrativo
            </p>
            <h1
              style={{
                margin: '3px 0 0',
                fontSize: '19px',
                fontWeight: 700,
                color: '#FFFFFF',
                fontFamily: 'Georgia, serif',
              }}
            >
              {INSTITUTION_PROFILE.legalName} — {INSTITUTION_PROFILE.popularName}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#E2E8F0' }}>
              CNPJ {INSTITUTION_PROFILE.cnpj} · CNAE {INSTITUTION_PROFILE.cnaePrincipal}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '10.5px', color: '#CBD5E1' }}>
              {INSTITUTION_PROFILE.fullAddress} · WhatsApp {INSTITUTION_PROFILE.phoneDisplay}
            </p>
          </div>
        </div>

        <div
          style={{
            textAlign: 'right',
            fontSize: '10.5px',
            color: '#F1F5F9',
            flexShrink: 0,
          }}
        >
          <p style={{ margin: 0, fontWeight: 700 }}>Emissão: {generatedAt}</p>
          <p style={{ margin: '4px 0 0' }}>
            Visitas no portal: {visitorStats.totalVisits.toLocaleString('pt-BR')}
          </p>
          <p style={{ margin: '2px 0 0' }}>
            Visitantes únicos: {visitorStats.uniqueVisitors.toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Executive KPI Summary Grid */}
      <div
        style={{
          padding: '18px 28px 10px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          backgroundColor: '#FBF9F5',
          borderBottom: '1px solid #E2DDD3',
        }}
      >
        {[
          { label: 'Doações Registradas', value: `${donations.length} registro(s)` },
          {
            label: 'Receitas / Saldo Contábil',
            value: `${formatBRL(totalEntradas)} / ${formatBRL(netBalance)}`,
          },
          {
            label: 'Voluntários (Frentes / Inscritos)',
            value: `${VOLUNTEER_ROLES.length} / ${volunteerApplications.length}`,
          },
          { label: 'Alimentos / Insumos Doados', value: `${totalFoodUnits} unid/kg` },
          {
            label: 'Coletas Feitas / Agendadas',
            value: `${completedPickups} / ${pickups.length}`,
          },
          {
            label: 'Pessoas Assistidas',
            value: `${assistedPeople.length} (${activeAssisted} ativas)`,
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D6CEBE',
              borderRadius: '6px',
              padding: '10px 12px',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '9.5px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#64748B',
                fontWeight: 600,
              }}
            >
              {kpi.label}
            </p>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '13.5px',
                fontWeight: 700,
                color: '#14532D',
              }}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Categorized Sections */}
      <div style={{ padding: '18px 28px 26px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* 1. DOAÇÕES */}
        {categories.donations && (
          <section>
            <div
              style={{
                backgroundColor: '#F4F0E8',
                borderLeft: '4px solid #14532D',
                padding: '8px 12px',
                marginBottom: '8px',
              }}
            >
              <p style={{ margin: 0, fontSize: '9.5px', fontWeight: 700, color: '#14532D', textTransform: 'uppercase' }}>
                Categoria {sectionIndex++}
              </p>
              <h2 style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 700, color: '#1C1917' }}>
                Relatório de Doações
              </h2>
            </div>

            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Data</th>
                  <th style={thStyle}>Protocolo</th>
                  <th style={thStyle}>Colaborador</th>
                  <th style={thStyle}>Canal</th>
                  <th style={thStyle}>Valor / Itens</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {donations.length > 0 ? (
                  donations.map((d, i) => (
                    <tr
                      key={d.id}
                      style={{ backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#FBF9F5' }}
                    >
                      <td style={tdStyle}>{d.createdAt}</td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{d.referenceCode}</td>
                      <td style={tdStyle}>{d.donorName}</td>
                      <td style={tdStyle}>{d.type}</td>
                      <td style={tdStyle}>
                        {typeof d.amountBRL === 'number'
                          ? formatBRL(d.amountBRL)
                          : d.itemsSummary || '—'}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{d.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#64748B' }}>
                      Nenhuma doação registrada no período (valores zerados em R$ 0,00).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        {/* 2. VOLUNTÁRIOS */}
        {categories.volunteers && (
          <section>
            <div
              style={{
                backgroundColor: '#F4F0E8',
                borderLeft: '4px solid #14532D',
                padding: '8px 12px',
                marginBottom: '8px',
              }}
            >
              <p style={{ margin: 0, fontSize: '9.5px', fontWeight: 700, color: '#14532D', textTransform: 'uppercase' }}>
                Categoria {sectionIndex++}
              </p>
              <h2 style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 700, color: '#1C1917' }}>
                Relatório de Voluntários
              </h2>
            </div>

            <table style={{ ...tableStyle, marginBottom: '10px' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Frente de Atuação</th>
                  <th style={thStyle}>Categoria</th>
                  <th style={thStyle}>Turno / Horário</th>
                  <th style={thStyle}>Vagas</th>
                </tr>
              </thead>
              <tbody>
                {VOLUNTEER_ROLES.map((r, i) => (
                  <tr
                    key={r.id}
                    style={{ backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#FBF9F5' }}
                  >
                    <td style={tdStyle}>{r.title}</td>
                    <td style={tdStyle}>{r.category}</td>
                    <td style={tdStyle}>
                      {r.shift} ({r.schedule})
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace' }}>
                      {r.spotsFilled}/{r.spotsTotal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, backgroundColor: '#44403C', borderBottomColor: '#44403C' }}>
                    Voluntário Inscrito via Portal
                  </th>
                  <th style={{ ...thStyle, backgroundColor: '#44403C', borderBottomColor: '#44403C' }}>
                    Telefone
                  </th>
                  <th style={{ ...thStyle, backgroundColor: '#44403C', borderBottomColor: '#44403C' }}>
                    Vaga Escolhida
                  </th>
                  <th style={{ ...thStyle, backgroundColor: '#44403C', borderBottomColor: '#44403C' }}>
                    Disponibilidade
                  </th>
                  <th style={{ ...thStyle, backgroundColor: '#44403C', borderBottomColor: '#44403C' }}>
                    Data
                  </th>
                </tr>
              </thead>
              <tbody>
                {volunteerApplications.length > 0 ? (
                  volunteerApplications.map((v, i) => (
                    <tr
                      key={v.id}
                      style={{ backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#FBF9F5' }}
                    >
                      <td style={tdStyle}>{v.fullName}</td>
                      <td style={tdStyle}>{v.phone}</td>
                      <td style={tdStyle}>{v.roleTitle}</td>
                      <td style={tdStyle}>{v.availability}</td>
                      <td style={tdStyle}>{v.createdAt}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#64748B' }}>
                      Nenhuma nova inscrição de voluntário registrada neste dispositivo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        {/* 3. RECEITAS DE DOAÇÕES & CONTABILIDADE */}
        {categories.revenues && (
          <section>
            <div
              style={{
                backgroundColor: '#F4F0E8',
                borderLeft: '4px solid #14532D',
                padding: '8px 12px',
                marginBottom: '8px',
              }}
            >
              <p style={{ margin: 0, fontSize: '9.5px', fontWeight: 700, color: '#14532D', textTransform: 'uppercase' }}>
                Categoria {sectionIndex++}
              </p>
              <h2 style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 700, color: '#1C1917' }}>
                Relatório de Receitas de Doações &amp; Contabilidade
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: '10.5px', color: '#57534E' }}>
                Entradas: {formatBRL(totalEntradas)} · Saídas: {formatBRL(totalSaidas)} · Saldo:{' '}
                {formatBRL(netBalance)} · MRR Mensal PIX: {formatBRL(mrr)}
              </p>
            </div>

            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Data</th>
                  <th style={thStyle}>Doc / Ref</th>
                  <th style={thStyle}>Tipo</th>
                  <th style={thStyle}>Categoria</th>
                  <th style={thStyle}>Descrição</th>
                  <th style={thStyle}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {accountingEntries.length > 0 ? (
                  accountingEntries.map((a, i) => (
                    <tr
                      key={a.id}
                      style={{ backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#FBF9F5' }}
                    >
                      <td style={tdStyle}>{a.date}</td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{a.referenceCode}</td>
                      <td style={tdStyle}>{a.kind}</td>
                      <td style={tdStyle}>{a.category}</td>
                      <td style={tdStyle}>{a.description}</td>
                      <td
                        style={{
                          ...tdStyle,
                          fontWeight: 700,
                          color: a.kind === 'Entrada' ? '#16A34A' : '#DC2626',
                        }}
                      >
                        {a.kind === 'Entrada' ? '+' : '-'} {formatBRL(a.amountBRL)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#64748B' }}>
                      Nenhuma receita ou lançamento contábil registrado (R$ 0,00).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        {/* 4. ALIMENTOS / COMIDAS DOADAS */}
        {categories.donatedFoods && (
          <section>
            <div
              style={{
                backgroundColor: '#F4F0E8',
                borderLeft: '4px solid #14532D',
                padding: '8px 12px',
                marginBottom: '8px',
              }}
            >
              <p style={{ margin: 0, fontSize: '9.5px', fontWeight: 700, color: '#14532D', textTransform: 'uppercase' }}>
                Categoria {sectionIndex++}
              </p>
              <h2 style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 700, color: '#1C1917' }}>
                Relatório de Alimentos e Insumos Doados
              </h2>
            </div>

            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Alimento / Insumo</th>
                  <th style={thStyle}>Categoria</th>
                  <th style={thStyle}>Unidade</th>
                  <th style={thStyle}>Qtd. Doada</th>
                  <th style={thStyle}>Meta</th>
                  <th style={thStyle}>Prioridade</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr
                    key={p.id}
                    style={{ backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#FBF9F5' }}
                  >
                    <td style={tdStyle}>{p.name}</td>
                    <td style={tdStyle}>{p.category}</td>
                    <td style={tdStyle}>{p.unit}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 700 }}>
                      {p.receivedQty}
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{p.targetQty}</td>
                    <td style={tdStyle}>{p.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* 5. NÚMERO DE COLETAS FEITAS */}
        {categories.pickupsCount && (
          <section>
            <div
              style={{
                backgroundColor: '#F4F0E8',
                borderLeft: '4px solid #14532D',
                padding: '8px 12px',
                marginBottom: '8px',
              }}
            >
              <p style={{ margin: 0, fontSize: '9.5px', fontWeight: 700, color: '#14532D', textTransform: 'uppercase' }}>
                Categoria {sectionIndex++}
              </p>
              <h2 style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 700, color: '#1C1917' }}>
                Relatório de Número de Coletas Feitas ({completedPickups} concluídas / {pickups.length} total)
              </h2>
            </div>

            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Data Preferencial</th>
                  <th style={thStyle}>Turno</th>
                  <th style={thStyle}>Colaborador</th>
                  <th style={thStyle}>Endereço</th>
                  <th style={thStyle}>Itens</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {pickups.length > 0 ? (
                  pickups.map((p, i) => (
                    <tr
                      key={p.id}
                      style={{ backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#FBF9F5' }}
                    >
                      <td style={tdStyle}>{p.preferredDate}</td>
                      <td style={tdStyle}>{p.preferredShift}</td>
                      <td style={tdStyle}>{p.collaboratorName}</td>
                      <td style={tdStyle}>{p.pickupAddress}</td>
                      <td style={tdStyle}>
                        {p.items.map((it) => `${it.quantity} ${it.unit} ${it.productName}`).join(', ') ||
                          p.customItemsText ||
                          '—'}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{p.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#64748B' }}>
                      Nenhuma coleta realizada ou agendada no período (0 coletas).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        {/* 6. PESSOAS ASSISTIDAS */}
        {categories.assistedPeople && (
          <section>
            <div
              style={{
                backgroundColor: '#F4F0E8',
                borderLeft: '4px solid #14532D',
                padding: '8px 12px',
                marginBottom: '8px',
              }}
            >
              <p style={{ margin: 0, fontSize: '9.5px', fontWeight: 700, color: '#14532D', textTransform: 'uppercase' }}>
                Categoria {sectionIndex++}
              </p>
              <h2 style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 700, color: '#1C1917' }}>
                Cadastro de Pessoas Assistidas pela Associação ({assistedPeople.length})
              </h2>
            </div>

            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Nome Completo</th>
                  <th style={thStyle}>E-mail</th>
                  <th style={thStyle}>Telefone</th>
                  <th style={thStyle}>Bairro / Família</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {assistedPeople.length > 0 ? (
                  assistedPeople.map((p, i) => (
                    <tr
                      key={p.id}
                      style={{ backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#FBF9F5' }}
                    >
                      <td style={tdStyle}>{p.fullName}</td>
                      <td style={tdStyle}>{p.email}</td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{p.phone}</td>
                      <td style={tdStyle}>
                        {p.neighborhood || 'Plácido de Castro'} ({p.householdSize ?? 1} pessoa(s))
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{p.status}</td>
                      <td style={tdStyle}>{p.createdAt}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#64748B' }}>
                      Nenhuma pessoa assistida cadastrada até o momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}
      </div>

      {/* Sheet Footer */}
      <div
        style={{
          borderTop: '1px solid #E2DDD3',
          backgroundColor: '#F4F0E8',
          padding: '12px 28px',
          fontSize: '10px',
          color: '#57534E',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <span>
          {INSTITUTION_PROFILE.legalName} ({INSTITUTION_PROFILE.popularName}) · CNPJ{' '}
          {INSTITUTION_PROFILE.cnpj} · {INSTITUTION_PROFILE.stateLawShort}
        </span>
        <span>{INSTITUTION_PROFILE.fullAddress}</span>
      </div>
    </div>
  );
});
